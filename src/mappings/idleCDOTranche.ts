import { ADDRESS_ZERO } from './helpers';
import { ERC20 } from "../../generated/templates/IdleCDOTranche/ERC20";
import { ethereum, BigInt, Address, log } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/templates/IdleCDOTranche/IdleCDOTranche";
import { IdleCDO as IdleCDOContract } from "../../generated/templates/IdleCDO/IdleCDO";
// import { UniswapV2Router } from "../../generated/templates/UniswapV2Router/UniswapV2Router";
import { CDO, Tranche, depositAAEvent, depositBBEvent, withdrawAAEvent, withdrawBBEvent, transferAA, transferBB, TrancheInfo, LastState } from "../../generated/schema";

export function handleBlock(block: ethereum.Block): void {
  let lastState = LastState.load('last');
  if (lastState){
    if (block.timestamp.minus(lastState.timeStamp).ge(BigInt.fromI32(3600))){
      for (let i = lastState.CDOs.length - 1; i >= 0; i--) {
        log.debug('Loading CDO Entity from address {}',[lastState.CDOs[i]]);
        const CDOEntity = CDO.load(lastState.CDOs[i]);
        if (CDOEntity){
          log.debug('Loading CDO Contract from address {}',[CDOEntity.id]);
          const CDOContract = IdleCDOContract.bind(Address.fromString(CDOEntity.id));
          if (CDOContract){
            /*
            const uniswapPath = [ADDRESS_DAI];
            if (ADDRESS_WETH.toLowerCase() !== CDOEntity.underlyingToken.toLowerCase() ){
              uniswapPath.push(ADDRESS_WETH);
            }
            uniswapPath.push(CDOEntity.underlyingToken);

            const UniswapV2RouterContract = UniswapV2Router.bind(Address.fromString(ADDRESS_UNISWAP_ROUTER));
            const UniswapRouterCall = UniswapV2RouterContract.try_getAmountsIn(['1000000000000000000', uniswapPath]);
            let underlyingPrice = BigInt.fromString('1000000000000000000');
            if (UniswapRouterCall.reverted) {
              log.error('Uniswap Conversion Price call for Underlying {} got reverted.',[CDOEntity.underlyingToken]);
            } else if (UniswapRouterCall.value) {
              underlyingPrice = UniswapRouterCall.value[0];
              log.debug('Got Uniswap Conversion Price for Underlying {}, Price: {}.',[CDOEntity.underlyingToken,underlyingPrice.toString()]);
            } else {
              log.error('Uniswap Conversion Price call for Underlying {} got null.',[CDOEntity.underlyingToken]);
            }
            */

            const AATranche = Tranche.load(CDOEntity.AATrancheToken);
            if (AATranche){
              const AATrancheContract = ERC20.bind(Address.fromString(AATranche.id));
              if (AATrancheContract){
                const AATrancheTotalSupplyCall = AATrancheContract.try_totalSupply();
                if (AATrancheTotalSupplyCall.reverted) {
                  log.error('Total Supply call for CDO {} and Tranche {} got reverted.',[CDOEntity.id,AATranche.id]);
                } else {
                  const AATrancheVirtualPriceCall = CDOContract.try_virtualPrice(Address.fromString(AATranche.id));
                  if (AATrancheVirtualPriceCall.reverted) {
                    log.error('Virtual price call for CDO {} and Tranche {} got reverted.',[CDOEntity.id,AATranche.id]);
                  } else {
                    const AATrancheTotalSupply = AATrancheTotalSupplyCall.value;
                    const AATrancheVirtualPrice = AATrancheVirtualPriceCall.value;
                    const AATrancheApr = CDOContract.getApr(Address.fromString(AATranche.id));
                    const AATrancheContractValue = AATrancheTotalSupply.times(AATrancheVirtualPrice).div(BigInt.fromString('1000000000000000000'));

                    log.debug('AA Tranche {} - Total Supply: {}, Virtual Price: {}, Contract Value: {}, Apr: {}, Timestamp: {}',[AATranche.id,AATrancheTotalSupply.toString(),AATrancheVirtualPrice.toString(),AATrancheContractValue.toString(),AATrancheApr.toString(),block.timestamp.toString()]);

                    const AATrancheInfo = new TrancheInfo(AATranche.id+'_'+block.number.toString());
                    AATrancheInfo.apr = AATrancheApr;
                    AATrancheInfo.Tranche = AATranche.id;
                    AATrancheInfo.blockNumber = block.number;
                    AATrancheInfo.timeStamp = block.timestamp;
                    // AATrancheInfo.underlyingPrice = underlyingPrice;
                    AATrancheInfo.totalSupply = AATrancheTotalSupply;
                    AATrancheInfo.virtualPrice = AATrancheVirtualPrice;
                    AATrancheInfo.contractValue = AATrancheContractValue;
                    AATrancheInfo.save();
                  }
                }
              }
            }

            const BBTranche = Tranche.load(CDOEntity.BBTrancheToken);
            if (BBTranche){
              const BBTrancheContract = ERC20.bind(Address.fromString(BBTranche.id));
              if (BBTrancheContract){
                const BBTrancheTotalSupplyCall = BBTrancheContract.try_totalSupply();
                if (BBTrancheTotalSupplyCall.reverted) {
                  log.error('Total Supply call for CDO {} and Tranche {} got reverted.',[CDOEntity.id,BBTranche.id]);
                } else {
                  const BBTrancheVirtualPriceCall = CDOContract.try_virtualPrice(Address.fromString(BBTranche.id));
                  if (BBTrancheVirtualPriceCall.reverted) {
                      log.error('Virtual price call for CDO {} and Tranche {} got reverted.',[CDOEntity.id,BBTranche.id]);
                  } else {
                    const BBTrancheTotalSupply = BBTrancheTotalSupplyCall.value;
                    const BBTrancheVirtualPrice = BBTrancheVirtualPriceCall.value;
                    const BBTrancheApr = CDOContract.getApr(Address.fromString(BBTranche.id));
                    const BBTrancheContractValue = BBTrancheTotalSupply.times(BBTrancheVirtualPrice).div(BigInt.fromString('1000000000000000000'));

                    log.debug('BB Tranche {} - Total Supply: {}, Virtual Price: {}, Contract Value: {}, Apr: {}, Timestamp: {}',[BBTranche.id,BBTrancheTotalSupply.toString(),BBTrancheVirtualPrice.toString(),BBTrancheContractValue.toString(),BBTrancheApr.toString(),block.timestamp.toString()]);

                    const BBTrancheInfo = new TrancheInfo(BBTranche.id+'_'+block.number.toString());
                    BBTrancheInfo.apr = BBTrancheApr;
                    BBTrancheInfo.Tranche = BBTranche.id;
                    BBTrancheInfo.blockNumber = block.number;
                    BBTrancheInfo.timeStamp = block.timestamp;
                    // BBTrancheInfo.underlyingPrice = underlyingPrice;
                    BBTrancheInfo.totalSupply = BBTrancheTotalSupply;
                    BBTrancheInfo.virtualPrice = BBTrancheVirtualPrice;
                    BBTrancheInfo.contractValue = BBTrancheContractValue;
                    BBTrancheInfo.save();
                  }
                }
              }

            }
          }
        }
      }

      // Save new lastState
      lastState.timeStamp = block.timestamp;
      lastState.save();
    }
  }
}

export function handleTransfer(event: Transfer): void {
  let fromAddress = event.params.from;
  let toAddress = event.params.to;

  let tranche = Tranche.load(event.address.toHexString());
  let eventId = event.transaction.hash.toHexString() + "_" + event.logIndex.toHexString();

  if (tranche){

    log.debug('Handle Transfer - tranche: {}, trancheType: {}, from: {}, to: {}, value: {}',[tranche.id,tranche.type,fromAddress.toHexString(),toAddress.toHexString(),event.params.value.toString()]);

    if (fromAddress.toHexString() == ADDRESS_ZERO) {
      // if the from address is 0x0, then the event is a deposit
      // tranche.totalSupply = tranche.totalSupply.plus(event.params.value);
      if (tranche.type == "AATranche") {
        let depositAA = new depositAAEvent(eventId);
        depositAA.tranche = tranche.id;
        depositAA.amount = event.params.value;
        depositAA.sender = event.transaction.from;
        depositAA.blockNumber = event.block.number;
        depositAA.save();
      } else {
        let depositBB = new depositBBEvent(eventId);
        depositBB.tranche = tranche.id;
        depositBB.amount = event.params.value;
        depositBB.sender = event.transaction.from;
        depositBB.blockNumber = event.block.number;
        depositBB.save();
      }
    } else if (toAddress.toHexString() == ADDRESS_ZERO) {
      // if the to address is 0x0m then the event is a withdraw
      // tranche.totalSupply = tranche.totalSupply.minus(event.params.value);
      // if (tranche.totalSupply.lt(BigInt.fromI32(0))){
      //   tranche.totalSupply = BigInt.fromI32(0);
      // }

      if (tranche.type == "AATranche") {
        let withdrawAA = new withdrawAAEvent(eventId);
        withdrawAA.tranche = tranche.id;
        withdrawAA.amount = event.params.value;
        withdrawAA.sender = event.transaction.from;
        withdrawAA.blockNumber = event.block.number;
        withdrawAA.save();
      } else {
        let withdrawBB = new withdrawBBEvent(eventId);
        withdrawBB.tranche = tranche.id;
        withdrawBB.amount = event.params.value;
        withdrawBB.sender = event.transaction.from;
        withdrawBB.blockNumber = event.block.number;
        withdrawBB.save();
      }
    } else {
      // otherwise this is a normal tranfer
      if (tranche.type == "AATranche") {
        let tranferAA = new transferAA(eventId);
        tranferAA.tranche = tranche.id;
        tranferAA.amount = event.params.value;
        tranferAA.sender = event.transaction.from;
        tranferAA.blockNumber = event.block.number;

        tranferAA.to = event.params.to;
        tranferAA.from = event.params.from;

        tranferAA.save();
      } else {
        let tranferBB = new transferBB(eventId);
        tranferBB.tranche = tranche.id;
        tranferBB.amount = event.params.value;
        tranferBB.sender = event.transaction.from;
        tranferBB.blockNumber = event.block.number;

        tranferBB.from = event.params.from;
        tranferBB.to = event.params.to;
        tranferBB.save();
      }
    }
    // tranche.save();
  }
}