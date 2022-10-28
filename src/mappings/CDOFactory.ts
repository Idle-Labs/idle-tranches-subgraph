import { CDODeployed } from "../../generated/CDOFactory/CDOFactory"
import { IdleCDO, IdleCDOTranche } from "../../generated/templates"
import { customCDOsBlocks, customCDOsAddresses } from './customCDOs'
import { ethereum, Address, BigInt, DataSourceContext, log } from "@graphprotocol/graph-ts"
import { CDODeployedEvent, CDO, Tranche, TrancheInfo, LastState } from "../../generated/schema"
import { IdleCDO as IdleCDOContract } from "../../generated/templates/IdleCDO/IdleCDO"


export function handleCDODeployed(event: CDODeployed): void {
  let entity = CDODeployedEvent.load(event.transaction.hash.toHex())
  const CDOAddress = event.params.proxy;
  
  if (entity === null) {
    let lastState = LastState.load('last');
    if (lastState === null){
      lastState = new LastState('last');
    }
    entity = new CDODeployedEvent(event.transaction.from.toHex());
    const CDOContract = IdleCDOContract.bind(CDOAddress);

    const context = new DataSourceContext();
    
    const AATrancheAddress = CDOContract.AATranche();
    const BBTrancheAddress = CDOContract.BBTranche();
    const CDOUnderlyingToken = CDOContract.token();
    const CDOStrategy = CDOContract.strategy();
    const CDOStrategyToken = CDOContract.strategyToken();
    
    const CDOEntity = new CDO(CDOAddress.toHex())
    
    CDOEntity.underlyingToken = CDOUnderlyingToken;
    CDOEntity.AATrancheToken = AATrancheAddress.toHexString();
    CDOEntity.BBTrancheToken = BBTrancheAddress.toHexString();
    CDOEntity.strategy = CDOStrategy;
    CDOEntity.strategyToken = CDOStrategyToken;
    CDOEntity.save()

    log.debug('Created CDO - address: {}, underlying: {}, AA: {}, BB: {}, strategy: {}, strategyToken: {}',[CDOAddress.toHexString(),CDOUnderlyingToken.toHexString(),AATrancheAddress.toHexString(),BBTrancheAddress.toHexString(),CDOStrategy.toHexString(),CDOStrategyToken.toHexString()]);

    const AATranche = new Tranche(AATrancheAddress.toHexString());
    AATranche.type = "AATranche";
    AATranche.CDO = CDOEntity.id;
    AATranche.save();

    // Insert AA Tranche Info point
    const AATrancheVirtualPrice = CDOContract.virtualPrice(AATrancheAddress);
    const TrancheInfoAA = new TrancheInfo(event.block.number.toString());
    TrancheInfoAA.Tranche = AATranche.id;
    TrancheInfoAA.totalSupply = BigInt.fromI32(0);
    TrancheInfoAA.timeStamp = event.block.timestamp;
    TrancheInfoAA.contractValue = BigInt.fromI32(0);
    TrancheInfoAA.virtualPrice = AATrancheVirtualPrice;
    TrancheInfoAA.save();

    const BBTranche = new Tranche(BBTrancheAddress.toHexString());
    BBTranche.type = "BBTranche";
    BBTranche.CDO = CDOEntity.id;
    BBTranche.save();

    // Insert AA Tranche Info point
    const BBTrancheVirtualPrice = CDOContract.virtualPrice(BBTrancheAddress);
    const TrancheInfoBB = new TrancheInfo(event.block.number.toString());
    TrancheInfoBB.Tranche = BBTranche.id;
    TrancheInfoBB.totalSupply = BigInt.fromI32(0);
    TrancheInfoBB.contractValue = BigInt.fromI32(0);
    TrancheInfoBB.timeStamp = event.block.timestamp;
    TrancheInfoBB.virtualPrice = BBTrancheVirtualPrice;
    TrancheInfoBB.save();

    // Insert LastState
    lastState.timeStamp = event.block.timestamp;
    const cdos = lastState.CDOs;
    const tranches = lastState.Tranches;
    cdos.push(CDOEntity.id);
    tranches.push(AATranche.id);
    tranches.push(BBTranche.id);
    lastState.CDOs = cdos;
    lastState.Tranches = tranches;
    lastState.save();

    // Insert new templates
    context.setBytes("CDO", CDOAddress)
    context.setBytes("AATranche", AATrancheAddress)
    context.setBytes("BBTranche", BBTrancheAddress)

    IdleCDO.createWithContext(CDOAddress, context);
    IdleCDOTranche.createWithContext(AATrancheAddress as Address, context)
    IdleCDOTranche.createWithContext(BBTrancheAddress as Address, context)
  }
  entity.proxy = CDOAddress;
  entity.save()
}
export function handleBlock(block:ethereum.Block):void{

  for (let i = customCDOsBlocks.length-1; i >= 0; i--) {

    const CDOAddress = customCDOsAddresses[i];
    const CDOEntityFound = CDO.load(Address.fromString(CDOAddress).toHex());

    if(block.number.toString()>customCDOsBlocks[i] && CDOEntityFound===null){

      const context = new DataSourceContext();

      const CDOContract = IdleCDOContract.bind(Address.fromString(CDOAddress));
      
      const CDOStrategy = CDOContract.strategy();
      const CDOUnderlyingToken = CDOContract.token();
      const AATrancheAddress = CDOContract.AATranche();
      const BBTrancheAddress = CDOContract.BBTranche();
      const CDOStrategyToken = CDOContract.strategyToken();
      const CDOEntity = new CDO(Address.fromString(CDOAddress).toHex())

      CDOEntity.underlyingToken = CDOUnderlyingToken;
      CDOEntity.AATrancheToken = AATrancheAddress.toHexString();
      CDOEntity.BBTrancheToken = BBTrancheAddress.toHexString();
      CDOEntity.strategy = CDOStrategy;
      CDOEntity.strategyToken = CDOStrategyToken;
      CDOEntity.save()

      log.debug('Created CDO - address: {}, underlying: {}, AA: {}, BB: {}, strategy: {}, strategyToken: {}',[CDOAddress ,CDOUnderlyingToken.toHexString(), AATrancheAddress.toHexString(), BBTrancheAddress.toHexString(), CDOStrategy.toHexString(), CDOStrategyToken.toHexString()]);

      const AATranche = new Tranche(AATrancheAddress.toHexString());
      AATranche.type = "AATranche";
      AATranche.CDO = CDOEntity.id;
      AATranche.save();

      // Insert AA Tranche Info point
      const AATrancheVirtualPrice = CDOContract.virtualPrice(AATrancheAddress);
      const TrancheInfoAA = new TrancheInfo(AATranche.id+'_'+block.number.toString());
      TrancheInfoAA.Tranche = AATranche.id;
      TrancheInfoAA.blockNumber = block.number;
      TrancheInfoAA.timeStamp = block.timestamp;
      TrancheInfoAA.totalSupply = BigInt.fromI32(0);
      TrancheInfoAA.contractValue = BigInt.fromI32(0);
      TrancheInfoAA.virtualPrice = AATrancheVirtualPrice;
      TrancheInfoAA.save();

      const BBTranche = new Tranche(BBTrancheAddress.toHexString());
      BBTranche.type = "BBTranche";
      BBTranche.CDO = CDOEntity.id;
      BBTranche.save();

      // Insert AA Tranche Info point
      const BBTrancheVirtualPrice = CDOContract.virtualPrice(BBTrancheAddress);
      const TrancheInfoBB = new TrancheInfo(BBTranche.id+'_'+block.number.toString());
      TrancheInfoBB.Tranche = BBTranche.id;
      TrancheInfoBB.blockNumber = block.number;
      TrancheInfoBB.timeStamp = block.timestamp;
      TrancheInfoBB.totalSupply = BigInt.fromI32(0);
      TrancheInfoBB.contractValue = BigInt.fromI32(0);
      TrancheInfoBB.virtualPrice = BBTrancheVirtualPrice;
      TrancheInfoBB.save();

      let lastState = LastState.load('last');
      if (lastState === null){
        lastState = new LastState('last');
      }

      // Insert LastState
      lastState.timeStamp = block.timestamp;
      const cdos = lastState.CDOs;
      const tranches = lastState.Tranches;
      cdos.push(CDOEntity.id);
      tranches.push(AATranche.id);
      tranches.push(BBTranche.id);
      lastState.CDOs = cdos;
      lastState.Tranches = tranches;
      lastState.save();

      context.setBytes("CDO", Address.fromString(CDOAddress))
      context.setBytes("AATranche", AATrancheAddress)
      context.setBytes("BBTranche", BBTrancheAddress)

      IdleCDO.createWithContext(Address.fromString(CDOAddress), context);
      IdleCDOTranche.createWithContext(AATrancheAddress as Address, context)
      IdleCDOTranche.createWithContext(BBTrancheAddress as Address, context)
    }
  }

}
