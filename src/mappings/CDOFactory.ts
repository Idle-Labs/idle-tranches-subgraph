import { BigInt } from "@graphprotocol/graph-ts"
import { CDODeployed } from "../../generated/CDOFactory/CDOFactory"
import { IdleCDO } from "../../generated/templates"
import { CDODeployedEvent } from "../../generated/schema"

export function handleCDODeployed(event: CDODeployed): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = CDODeployedEvent.load(event.transaction.hash.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new CDODeployedEvent(event.transaction.from.toHex())
    IdleCDO.create(event.params.proxy);
  }
  entity.proxy = event.params.proxy;
  entity.save()
}
