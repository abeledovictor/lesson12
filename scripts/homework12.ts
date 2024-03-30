import {viem} from "hardhat"
import { parseEther, formatEther, toHex, hexToString } from "viem";

const MINT_VALUE = parseEther("100")
// TODO change toString to formatEther

async function main() {
  const publicClient = await viem.getPublicClient();
  const [deployer, acc1, acc2, acc3] = await viem.getWalletClients();
  // instead of deployer it should be name contract? ask
  const contract = await viem.deployContract("MyToken");
  const mintTx = await contract.write.mint([acc1.account.address, MINT_VALUE]);
  await publicClient.waitForTransactionReceipt({ hash: mintTx });
  const balanceBN = await contract.read.balanceOf([acc1.account.address]);
  console.log(
    `Account ${
      acc1.account.address
    } has ${formatEther(balanceBN)} units of MyToken\n`
  );

  // give 20 units of token to acc2
  const transferTx = await contract.write.transfer(
    [acc2.account.address, parseEther("20")],
    {
      account: acc1.account,
    }
  );
  await publicClient.waitForTransactionReceipt({ hash: transferTx });
  const balanceAfterTx = await contract.read.balanceOf([acc1.account.address]);
  console.log(
    `Account ${
      acc1.account.address
    } has ${formatEther(balanceAfterTx)} units of MyToke after TX\n`
  );
  const balanceAcc2AfterTx = await contract.read.balanceOf([acc2.account.address]);
  console.log(
    `Account ${
      acc2.account.address
    } has ${formatEther(balanceAcc2AfterTx)} units of MyToke after TX\n`
  );

  // give 30 units of token to acc3
  const transferTx2 = await contract.write.transfer(
    [acc3.account.address, parseEther("30")],
    {
      account: acc1.account,
    }
  );
  await publicClient.waitForTransactionReceipt({ hash: transferTx2 });
  const balanceAfterTx2 = await contract.read.balanceOf([acc1.account.address]);
  console.log(
    `Account ${
      acc1.account.address
    } has ${formatEther(balanceAfterTx2)} units of MyToke after TX\n`
  );
  const balanceAcc3AfterTx2 = await contract.read.balanceOf([acc3.account.address]);
  console.log(
    `Account ${
      acc3.account.address
    } has ${formatEther(balanceAcc3AfterTx2)} units of MyToke after TX\n`
  );


  // Delegate voting power
  const delegateTx = await contract.write.delegate([acc1.account.address], {
    account: acc1.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: delegateTx });
  const votesAfterDelegate = await contract.read.getVotes([acc1.account.address]);
  console.log(
    `Account ${
      acc1.account.address
    } has ${formatEther(votesAfterDelegate)} units of voting power after delegating\n`
  );

  const delegateTx2 = await contract.write.delegate([acc2.account.address], {
    account: acc2.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: delegateTx2 });
  const votesAfterDelegate2 = await contract.read.getVotes([acc2.account.address]);
  console.log(
    `Account ${
      acc2.account.address
    } has ${formatEther(votesAfterDelegate2)} units of voting power after delegating\n`
  );

  const delegateTx3 = await contract.write.delegate([acc3.account.address], {
    account: acc3.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: delegateTx3 });
  const votesAfterDelegate3 = await contract.read.getVotes([acc3.account.address]);
  console.log(
    `Account ${
      acc3.account.address
    } has ${formatEther(votesAfterDelegate3)} units of voting power after delegating\n`
  );

  // Now we deploy the ballot
  const blockNumber = await publicClient.getBlockNumber()
  const PROPOSALS = ["Vanilla", "Chocolate", "Strawberry"]
  const ballotContract = await viem.deployContract("TokenizedBallot", [
    PROPOSALS.map((prop) => toHex(prop, { size: 32 })),
    contract.address,
    blockNumber,
  ]);

  for (let index = 0; index < PROPOSALS.length; index++) {
    const proposal = await ballotContract.read.proposals([BigInt(index)]);
    const name = hexToString(proposal[0], { size: 32 });
    console.log("Proposals -> ", { index, name, proposal });
}

  // Cast votes
  const voteTx = await ballotContract.write.vote([BigInt(0), parseEther("1")], {
    account: acc1.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: voteTx });

  const voteTx2 = await ballotContract.write.vote([BigInt(1), parseEther("15")], {
    account: acc2.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: voteTx2 });

  const voteTx3 = await ballotContract.write.vote([BigInt(2), parseEther("19")], {
    account: acc3.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: voteTx3 });

  // Query results
  const winnerName = await ballotContract.read.winnerName()
  const blockNumber2 = await publicClient.getBlockNumber()
  const pastVotes = await contract.read.getPastVotes([acc3.account.address, blockNumber2 - 1n])
  console.log("Past votes of 3: ", pastVotes)
  console.log("The winning proposal is: " + hexToString(winnerName, { size: 32 }))

}


main().catch(err => {
  console.log(err)
  process.exitCode = 1
})