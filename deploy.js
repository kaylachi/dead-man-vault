require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ethers } = require('ethers');
const solc = require('solc');

const RPC_URL = process.env.RPC_URL || 'https://rpc.botchain.ai';
const CHAIN_ID = Number(process.env.CHAIN_ID) || 677;
const REPO_URL = 'https://github.com/kaylachi/dead-man-vault';

async function main() {
    console.log('====================================================');
    console.log('⚰️  DEAD-MAN VAULT: AUTOMATED DEPLOYER');
    console.log('====================================================\n');

    // 1. Verify Private Key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey || privateKey.trim() === '' || privateKey.includes('PASTE') || !privateKey.startsWith('0x') || privateKey.length !== 66) {
        console.error('❌ Error: PRIVATE_KEY is missing or invalid in .env!');
        console.error('👉 Please open .env and set PRIVATE_KEY=0xYourNewPrivateKey (must be 66 characters)');
        process.exitCode = 1;
        return;
    }

    // 2. Setup Provider & Wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL, {
        name: 'BOT Chain',
        chainId: CHAIN_ID
    });

    const wallet = new ethers.Wallet(privateKey.trim(), provider);
    console.log(`🔑 Deployer Wallet:  ${wallet.address}`);

    const balanceWei = await provider.getBalance(wallet.address);
    const balanceBot = ethers.formatEther(balanceWei);
    console.log(`💰 Wallet Balance:    ${balanceBot} BOT`);

    if (balanceWei < ethers.parseEther('0.005')) {
        console.error(`\n❌ Error: Insufficient funds for deployment!`);
        console.error(`Current balance: ${balanceBot} BOT`);
        console.error(`Estimated deployment cost: ~0.007 - 0.015 BOT.`);
        console.error(`Please fund ${wallet.address} with at least 0.02 BOT before running.`);
        process.exitCode = 1;
        return;
    }

    // 3. Compile Contract
    console.log('\n⚙️  Compiling DeadManVault.sol (EVM target: paris)...');
    const contractPath = path.join(__dirname, 'DeadManVault.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'DeadManVault.sol': { content: source }
        },
        settings: {
            optimizer: { enabled: true, runs: 200 },
            evmVersion: 'paris',
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode.object']
                }
            }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        const errors = output.errors.filter(e => e.severity === 'error');
        if (errors.length > 0) {
            console.error('❌ Compilation errors:');
            errors.forEach(e => console.error(e.formattedMessage));
            process.exitCode = 1;
            return;
        }
    }

    const compiled = output.contracts['DeadManVault.sol']['DeadManVault'];
    const abi = compiled.abi;
    const bytecode = compiled.evm.bytecode.object;
    console.log('✅ Compilation successful!');

    // 4. Configure Constructor Parameters
    const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS && ethers.isAddress(process.env.BENEFICIARY_ADDRESS)
        ? process.env.BENEFICIARY_ADDRESS
        : wallet.address; // default to deployer if not specified

    const timeoutSeconds = Number(process.env.TIMEOUT_SECONDS) || (90 * 24 * 3600); // 90 days default

    console.log('\n📋 Constructor Configuration:');
    console.log(`- Beneficiary Address: ${beneficiaryAddress}`);
    console.log(`- Inactivity Timeout:  ${timeoutSeconds} seconds (${Math.round(timeoutSeconds / 86400)} days)`);

    // 5. Deploy Contract
    console.log('\n🚀 Broadcasting deployment transaction to BOT Chain...');
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(beneficiaryAddress, timeoutSeconds);

    console.log(`⏳ Tx Hash: ${contract.deploymentTransaction().hash}`);
    console.log('Waiting for block confirmation...');

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log('\n====================================================');
    console.log('🎉 CONTRACT DEPLOYED SUCCESSFULLY!');
    console.log('====================================================');
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`BOTScan Explorer: https://scan.botchain.ai/address/${contractAddress}`);

    // 6. Update tally.json with official schema
    console.log('\n📝 Generating tally.json provenance file...');
    const tallyData = {
        version: 1,
        contracts: [
            {
                chainId: CHAIN_ID,
                address: contractAddress,
                signer: wallet.address
            }
        ]
    };
    fs.writeFileSync(path.join(__dirname, 'tally.json'), JSON.stringify(tallyData, null, 2));
    console.log('✅ tally.json created!');

    // 7. Update README.md
    console.log('📝 Updating README.md with contract address and badges...');
    const readmePath = path.join(__dirname, 'README.md');
    let readme = fs.readFileSync(readmePath, 'utf8');
    readme = readme.replace(/CONTRACT_ADDRESS_PLACEHOLDER/g, contractAddress);
    fs.writeFileSync(readmePath, readme);
    console.log('✅ README.md updated!');

    // 8. Commit and Push to GitHub
    console.log('\n🔄 Committing and pushing updates to GitHub...');
    try {
        execSync('git add tally.json README.md', { cwd: __dirname });
        execSync(`git commit -m "Configure tally.json for ${contractAddress}"`, { cwd: __dirname });
        execSync('git push origin main', { cwd: __dirname });
        console.log(`✅ Pushed to ${REPO_URL}`);
    } catch (err) {
        console.warn('⚠️  Could not automatically push to git (you can push manually):', err.message);
    }

    // 9. Instructions for Tally Final Step
    console.log('\n====================================================');
    console.log('🏁 FINAL STEP: COMPLETE REGISTRATION ON TALLY');
    console.log('====================================================');
    console.log('1. Open: https://tallyarc.tech/register?chain=bot');
    console.log(`2. Contract Address: ${contractAddress}`);
    console.log(`3. Repo URL:         ${REPO_URL}`);
    console.log('4. Click "Check what can be proven" -> "Sign and register"');
    console.log('\nYour contract record will immediately show "TALLY VERIFIED" (Green)! 🟢\n');
}

main().catch(err => {
    console.error('\n❌ Deployment failed:', err);
    process.exitCode = 1;
});
