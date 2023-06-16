import { BigInt, log } from "@graphprotocol/graph-ts";
import { TokenRebasedEvent } from "../../generated/schema"
import { TokenRebased } from "../../generated/lido/LidoContract"

export function handleTokenRebased(event: TokenRebased): void {
  let tokenRebased = TokenRebasedEvent.load('last');

  if (tokenRebased === null){
    tokenRebased = new TokenRebasedEvent('last');
  }

  tokenRebased.reportTimestamp = event.params.reportTimestamp;
  tokenRebased.timeElapsed = event.params.timeElapsed;
  tokenRebased.preTotalShares = event.params.preTotalShares;
  tokenRebased.preTotalEther = event.params.preTotalEther;
  tokenRebased.postTotalShares = event.params.postTotalShares;
  tokenRebased.postTotalEther = event.params.postTotalEther;
  tokenRebased.sharesMintedAsFees = event.params.sharesMintedAsFees;
  tokenRebased.blockNumber = event.block.number;

  const preShareRate = event.params.preTotalEther.times(BigInt.fromString('1000000000000000000000000000')).div(event.params.preTotalShares);
  const postShareRate = event.params.postTotalEther.times(BigInt.fromString('1000000000000000000000000000')).div(event.params.postTotalShares);

  tokenRebased.userAPR = BigInt.fromString('3087900000').times(postShareRate.minus(preShareRate).times(BigInt.fromString('1000000000000000000')).div(preShareRate).div(event.params.timeElapsed))

  log.debug('blockNumber: {}, reportTimestamp: {}, timeElapsed: {}, preTotalShares: {}, preTotalEther: {}, postTotalShares: {}, postTotalEther: {}, sharesMintedAsFees: {}, preShareRate: {}, postShareRate: {}, userAPR: {}', [tokenRebased.blockNumber.toString(), tokenRebased.reportTimestamp.toString(), tokenRebased.timeElapsed.toString(), tokenRebased.preTotalShares.toString(), tokenRebased.preTotalEther.toString(), tokenRebased.postTotalShares.toString(), tokenRebased.postTotalEther.toString(), tokenRebased.sharesMintedAsFees.toString(), preShareRate.toString(), postShareRate.toString(), tokenRebased.userAPR.toString()]);

  tokenRebased.save();
}