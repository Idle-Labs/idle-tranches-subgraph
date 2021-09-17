import { Address, BigInt, DataSourceContext } from "@graphprotocol/graph-ts"
import { CDODeployed } from "../../generated/CDOFactory/CDOFactory"
import { IdleCDO as IdleCDOContract } from "../../generated/templates/IdleCDO/IdleCDO"
import { IdleCDO, IdleCDOTranche } from "../../generated/templates"
import { CDODeployedEvent, CDO } from "../../generated/schema"

export function handleCDODeployed(event: CDODeployed): void {
  let entity = CDODeployedEvent.load(event.transaction.hash.toHex())

  let CDOAddress = event.params.proxy;

  if (entity == null) {
    entity = new CDODeployedEvent(event.transaction.from.toHex())
    let CDOContract = IdleCDOContract.bind(CDOAddress)

    let context = new DataSourceContext();

    context.setBytes("CDO", CDOAddress)
    context.setBytes("AATranche", CDOContract.AATranche())
    context.setBytes("BBTranche", CDOContract.BBTranche())
    context.setBytes("underlyingToken", CDOContract.token())
    context.setBytes("strategy", CDOContract.strategy())
    context.setBytes("strategyToken", CDOContract.strategyToken())
    
    
    let CDOEntity = new CDO(CDOAddress.toHex())

    CDOEntity.AATrancheToken = context.getBytes("AATranche");
    CDOEntity.BBTrancheToken = context.getBytes("BBTranche");
    CDOEntity.underlyingToken = context.getBytes("underlyingToken")
    CDOEntity.strategy = context.getBytes("strategy")
    CDOEntity.strategyToken = context.getBytes("strategyToken")

    IdleCDO.createWithContext(CDOAddress, context);
    IdleCDOTranche.createWithContext(context.getBytes("AATranche"), context)
    IdleCDOTranche.createWithContext(context.getBytes("BBTranche"), context)

    CDOEntity.save()
  }
  entity.proxy = CDOAddress;
  entity.save()
}
