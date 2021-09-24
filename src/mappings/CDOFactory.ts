import { Address, BigInt, DataSourceContext } from "@graphprotocol/graph-ts"
import { CDODeployed } from "../../generated/CDOFactory/CDOFactory"
import { IdleCDO as IdleCDOContract } from "../../generated/templates/IdleCDO/IdleCDO"
import { IdleCDO, IdleCDOTranche } from "../../generated/templates"
import { CDODeployedEvent, CDO, Tranche } from "../../generated/schema"

export function handleCDODeployed(event: CDODeployed): void {
  let entity = CDODeployedEvent.load(event.transaction.hash.toHex())

  let CDOAddress = event.params.proxy;

  if (entity == null) {
    entity = new CDODeployedEvent(event.transaction.from.toHex())
    let CDOContract = IdleCDOContract.bind(CDOAddress)

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

    let AATranche = new Tranche(AATrancheAddress.toHexString());
    AATranche.type = "AATranche";
    AATranche.CDO = CDOEntity.id;
    AATranche.totalSupply = BigInt.fromI32(0);
    AATranche.save();

    let BBTranche = new Tranche(BBTrancheAddress.toHexString());
    BBTranche.type = "BBTranche";
    BBTranche.CDO = CDOEntity.id;
    BBTranche.totalSupply = BigInt.fromI32(0);
    BBTranche.save();

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
