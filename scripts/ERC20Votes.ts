import {viem} from "hardhat"
import { parseEther, formatEther } from "viem";

const MINT_VALUE = parseEther("100")
// TODO change toString to formatEther

async function main() {
  const publicClient = await viem.getPublicClient();
  const [deployer, acc1, acc2] = await viem.getWalletClients();
  const contract = await viem.deployContract("MyToken");
  console.log(`Token contract deployed at ${contract.address}\n`);

  const mintTx = await contract.write.mint([acc1.account.address, MINT_VALUE]);
  await publicClient.waitForTransactionReceipt({ hash: mintTx });
  console.log(
    `Minted ${MINT_VALUE.toString()} decimal units to account ${
      acc1.account.address
    }\n`
  );
  const balanceBN = await contract.read.balanceOf([acc1.account.address]);
  console.log(
    `Account ${
      acc1.account.address
    } has ${balanceBN.toString()} decimal units of MyToken\n`
  );

  const votes = await contract.read.getVotes([acc1.account.address]);
  console.log(
    `Account ${
      acc1.account.address
    } has ${votes.toString()} units of voting power before self delegating\n`
  );
  // It needs to self delegate to have voting power (make txs cheaper)
  const delegateTx = await contract.write.delegate([acc1.account.address], {
    account: acc1.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: delegateTx });
  const votesAfter = await contract.read.getVotes([acc1.account.address]);
  console.log(
    `Account ${
      acc1.account.address
    } has ${votesAfter.toString()} units of voting power after self delegating\n`
  );

    // create transfer tx from acc1 to acc2. 50% of token. Buy tokens and sell them
    // after transfer, acc1 has lost half of voting power
    // acc2 voting power did not activate bc it did not self delegate
    const transferTx = await contract.write.transfer(
      [acc2.account.address, MINT_VALUE / 2n],
      {
        account: acc1.account,
      }
    );
    await publicClient.waitForTransactionReceipt({ hash: transferTx });
    const votes1AfterTransfer = await contract.read.getVotes([
      acc1.account.address,
    ]);
    console.log(
      `Account ${
        acc1.account.address
      } has ${votes1AfterTransfer.toString()} units of voting power after transferring\n`
    );
    const votes2AfterTransfer = await contract.read.getVotes([
      acc2.account.address,
    ]);
    console.log(
      `Account ${
        acc2.account.address
      } has ${votes2AfterTransfer.toString()} units of voting power after receiving a transfer\n`
    );

    // It needs to self delegate to have voting power
    const delegateTx2 = await contract.write.delegate([acc2.account.address], {
      account: acc2.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: delegateTx2 });
    const votesAfter2 = await contract.read.getVotes([acc2.account.address]);
    console.log(
      `Account ${
        acc2.account.address
      } has ${votesAfter2.toString()} units of voting power after self delegating\n`
    );

      // check past votes
    const lastBlockNumber = await publicClient.getBlockNumber();
    for (let index = lastBlockNumber - 1n; index > 0n; index--) {
      const pastVotes = await contract.read.getPastVotes([
        acc1.account.address,
        index,
      ]);
      console.log(
        `Account ${
          acc1.account.address
        } had ${pastVotes.toString()} units of voting power at block ${index}\n`
      );
    }


    // USE VOTING POWER IN elections
    
}


main().catch(err => {
  console.log(err)
  process.exitCode = 1
})