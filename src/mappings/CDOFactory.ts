import { CDODeployed } from "../../generated/CDOFactory/CDOFactory"
import { IdleCDO, IdleCDOTranche } from "../../generated/templates"
import { ethereum, Address, BigInt, DataSourceContext, log } from "@graphprotocol/graph-ts"
import { CDODeployedEvent, CDO, Tranche, TrancheInfo, LastState } from "../../generated/schema"
import { IdleCDO as IdleCDOContract } from "../../generated/templates/IdleCDO/IdleCDO"


export function handleCDODeployed(event: CDODeployed): void {
  let entity = CDODeployedEvent.load(event.transaction.hash.toHex())
  let CDOAddress = event.params.proxy;
  
  if (entity === null) {
    let lastState = LastState.load('last');
    if (lastState === null){
        lastState = new LastState('last');
    }
    entity = new CDODeployedEvent(event.transaction.from.toHex());
        let CDOContract = IdleCDOContract.bind(CDOAddress);
    
        let context = new DataSourceContext();
        
        let AATrancheAddress = CDOContract.AATranche();
        let BBTrancheAddress = CDOContract.BBTranche();
        let CDOUnderlyingToken = CDOContract.token();
        let CDOStrategy = CDOContract.strategy();
        let CDOStrategyToken = CDOContract.strategyToken();
        
        let CDOEntity = new CDO(CDOAddress.toHex())
        
        CDOEntity.underlyingToken = CDOUnderlyingToken;
        CDOEntity.AATrancheToken = AATrancheAddress.toHexString();
        CDOEntity.BBTrancheToken = BBTrancheAddress.toHexString();
        CDOEntity.strategy = CDOStrategy;
        CDOEntity.strategyToken = CDOStrategyToken;
        CDOEntity.save()
    
        log.debug('Created CDO - address: {}, underlying: {}, AA: {}, BB: {}, strategy: {}, strategyToken: {}',[CDOAddress.toHexString(),CDOUnderlyingToken.toHexString(),AATrancheAddress.toHexString(),BBTrancheAddress.toHexString(),CDOStrategy.toHexString(),CDOStrategyToken.toHexString()]);
    
        let AATranche = new Tranche(AATrancheAddress.toHexString());
        AATranche.type = "AATranche";
        AATranche.CDO = CDOEntity.id;
        AATranche.totalSupply = BigInt.fromI32(0);
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
    
        let BBTranche = new Tranche(BBTrancheAddress.toHexString());
        BBTranche.type = "BBTranche";
        BBTranche.CDO = CDOEntity.id;
        BBTranche.totalSupply = BigInt.fromI32(0);
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
        let cdos = lastState.CDOs;
        let tranches = lastState.Tranches;
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
      let DAIAddress="0xd0DbcD556cA22d3f3c142e9a3220053FD7a247BC"
      let DAIBlock="13555307"
      let daientity=CDO.load(Address.fromString(DAIAddress).toHex())
      if(DAIBlock<block.number.toString()&&daientity===null)
      
      {
        let CDOContract = IdleCDOContract.bind(Address.fromString(DAIAddress));
        let context = new DataSourceContext();
        let AATrancheAddress = CDOContract.AATranche();
        let BBTrancheAddress = CDOContract.BBTranche();
        let CDOUnderlyingToken = CDOContract.token();
        let CDOStrategy = CDOContract.strategy();
        let CDOStrategyToken = CDOContract.strategyToken();
        let CDOEntity = new CDO(Address.fromString(DAIAddress).toHex())
        
        CDOEntity.underlyingToken = CDOUnderlyingToken;
        CDOEntity.AATrancheToken = AATrancheAddress.toHexString();
        CDOEntity.BBTrancheToken = BBTrancheAddress.toHexString();
        CDOEntity.strategy = CDOStrategy;
        CDOEntity.strategyToken = CDOStrategyToken;
        CDOEntity.save()
    
        log.debug('Created CDO - address: {}, underlying: {}, AA: {}, BB: {}, strategy: {}, strategyToken: {}',[DAIAddress,CDOUnderlyingToken.toHexString(),AATrancheAddress.toHexString(),BBTrancheAddress.toHexString(),CDOStrategy.toHexString(),CDOStrategyToken.toHexString()]);
    
        let AATranche = new Tranche(AATrancheAddress.toHexString());
        AATranche.type = "AATranche";
        AATranche.CDO = CDOEntity.id;
        AATranche.totalSupply = BigInt.fromI32(0);
        AATranche.save();
    
        // Insert AA Tranche Info point
        const AATrancheVirtualPrice = CDOContract.virtualPrice(AATrancheAddress);
        const TrancheInfoAA = new TrancheInfo(block.number.toString());
        TrancheInfoAA.Tranche = AATranche.id;
        TrancheInfoAA.totalSupply = BigInt.fromI32(0);
        TrancheInfoAA.timeStamp = block.timestamp;
        TrancheInfoAA.contractValue = BigInt.fromI32(0);
        TrancheInfoAA.virtualPrice = AATrancheVirtualPrice;
        TrancheInfoAA.save();
    
        let BBTranche = new Tranche(BBTrancheAddress.toHexString());
        BBTranche.type = "BBTranche";
        BBTranche.CDO = CDOEntity.id;
        BBTranche.totalSupply = BigInt.fromI32(0);
        BBTranche.save();
    
        // Insert AA Tranche Info point
        const BBTrancheVirtualPrice = CDOContract.virtualPrice(BBTrancheAddress);
        const TrancheInfoBB = new TrancheInfo(block.number.toString());
        TrancheInfoBB.Tranche = BBTranche.id;
        TrancheInfoBB.totalSupply = BigInt.fromI32(0);
        TrancheInfoBB.contractValue = BigInt.fromI32(0);
        TrancheInfoBB.timeStamp = block.timestamp;
        TrancheInfoBB.virtualPrice = BBTrancheVirtualPrice;
        TrancheInfoBB.save();

        context.setBytes("CDO", Address.fromString(DAIAddress))
        context.setBytes("AATranche", AATrancheAddress)
        context.setBytes("BBTranche", BBTrancheAddress)
    
        IdleCDO.createWithContext(Address.fromString(DAIAddress), context);
        IdleCDOTranche.createWithContext(AATrancheAddress as Address, context)
        IdleCDOTranche.createWithContext(BBTrancheAddress as Address, context)
      }
}
