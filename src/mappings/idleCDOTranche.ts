import { BigInt } from '@graphprotocol/graph-ts'
import { Address } from "@graphprotocol/graph-ts";
import { Tranche, depositAAEvent, depositBBEvent, withdrawAAEvent, withdrawBBEvent } from "../../generated/schema";
import { Transfer } from "../../generated/templates/IdleCDOTranche/IdleCDOTranche"

export function handleTransfer(event: Transfer): void {
    let fromAddress = event.params.from;
    let toAddress = event.params.to;

    let tranche = Tranche.load(event.address.toHexString());
    let eventId = event.transaction.hash.toHexString() + "_" + event.logIndex.toHexString()

    if (fromAddress == Address.fromI32(0)) {
        // if the from address is 0x0, then the event is a deposit
        tranche.totalSupply = tranche.totalSupply.plus(event.params.value);
        if (tranche.type == "AATranche") {
            let depositAA = new depositAAEvent(eventId)
            depositAA.sender = event.transaction.from;
            depositAA.amount = event.params.value;
            depositAA.tranche = tranche.id;
            depositAA.save()
        } else {
            let depositBB = new depositBBEvent(eventId)
            depositBB.sender = event.transaction.from;
            depositBB.amount = event.params.value;
            depositBB.tranche = tranche.id;
            depositBB.save()
        }
    } else if (toAddress == Address.fromI32(0)) {
        // if the to address is 0x0m then the event is a withdraw
        tranche.totalSupply = tranche.totalSupply.minus(event.params.value);
        if (tranche.type == "AATranche") {
            let withdrawAA = new withdrawAAEvent(eventId)
            withdrawAA.sender = event.transaction.from;
            withdrawAA.amount = event.params.value;
            withdrawAA.tranche = tranche.id;
            withdrawAA.save()
        } else {
            let withdrawBB = new withdrawBBEvent(eventId)
            withdrawBB.sender = event.transaction.from;
            withdrawBB.amount = event.params.value;
            withdrawBB.tranche = tranche.id;
            withdrawBB.save()
        }
    } else {
        // otherwise this is a normal tranfer
    }

    tranche.save();
}