import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/templates/IdleCDOTranche/IdleCDOTranche";
import { IdleCDO as IdleCDOContract } from "../../generated/templates/IdleCDO/IdleCDO"
import { CDO, Tranche, depositAAEvent, depositBBEvent, withdrawAAEvent, withdrawBBEvent, transferAA, transferBB, TrancheInfo } from "../../generated/schema";

import { ADDRESS_ZERO } from './helpers';

export function handleTransfer(event: Transfer): void {
    let fromAddress = event.params.from;
    let toAddress = event.params.to;

    let tranche = Tranche.load(event.address.toHexString());
    let eventId = event.transaction.hash.toHexString() + "_" + event.logIndex.toHexString();

    if (tranche){
        if (fromAddress.toHexString() == ADDRESS_ZERO) {
            // if the from address is 0x0, then the event is a deposit
            tranche.totalSupply = tranche.totalSupply.plus(event.params.value);
            if (tranche.type == "AATranche") {
                let depositAA = new depositAAEvent(eventId)
                depositAA.sender = event.transaction.from;
                depositAA.amount = event.params.value;
                depositAA.tranche = tranche.id;
                depositAA.save();
            } else {
                let depositBB = new depositBBEvent(eventId)
                depositBB.sender = event.transaction.from;
                depositBB.amount = event.params.value;
                depositBB.tranche = tranche.id;
                depositBB.save();
            }
        } else if (toAddress.toHexString() == ADDRESS_ZERO) {
            // if the to address is 0x0m then the event is a withdraw
            tranche.totalSupply = tranche.totalSupply.minus(event.params.value);
            if (tranche.type == "AATranche") {
                let withdrawAA = new withdrawAAEvent(eventId)
                withdrawAA.sender = event.transaction.from;
                withdrawAA.amount = event.params.value;
                withdrawAA.tranche = tranche.id;
                withdrawAA.save();
            } else {
                let withdrawBB = new withdrawBBEvent(eventId)
                withdrawBB.sender = event.transaction.from;
                withdrawBB.amount = event.params.value;
                withdrawBB.tranche = tranche.id;
                withdrawBB.save();
            }
        } else {
            // otherwise this is a normal tranfer
            if (tranche.type == "AATranche") {
                let tranferAA = new transferAA(eventId)
                tranferAA.sender = event.transaction.from;
                tranferAA.amount = event.params.value;
                tranferAA.tranche = tranche.id;

                tranferAA.from = event.params.from;
                tranferAA.to = event.params.to;

                tranferAA.save();
            } else {
                let tranferBB = new transferBB(eventId)
                tranferBB.sender = event.transaction.from;
                tranferBB.amount = event.params.value;
                tranferBB.tranche = tranche.id;

                tranferBB.from = event.params.from;
                tranferBB.to = event.params.to;
                tranferBB.save();
            }
        }
        tranche.save();

        // Insert Tranche Info point
        const CDOEntity = CDO.load(tranche.CDO);
        log.debug('Loaded CDO Entity from address {}',[tranche.CDO]);
        if (CDOEntity){
            log.debug('Loading CDO Contract from address {}',[CDOEntity.id]);
            const CDOContract = IdleCDOContract.bind(Address.fromString(CDOEntity.id));
            if (CDOContract){
                const trancheVirtualPriceCall = CDOContract.try_virtualPrice(Address.fromString(tranche.id));
                if (trancheVirtualPriceCall.reverted){
                    log.error('Virtual price call for CDO {} and Tranche {} got reverted.',[CDOEntity.id,tranche.id]);
                } else {
                    const trancheVirtualPrice = trancheVirtualPriceCall.value;
                    const contractValue = tranche.totalSupply.times(trancheVirtualPrice).div(BigInt.fromString('1000000000000000000'));

                    log.debug('Tranche Virtual Price: {}, Contract Value: {}',[trancheVirtualPrice.toString(),contractValue.toString()]);

                    const TrancheInfo = new TrancheInfo(event.block.number.toString());
                    TrancheInfo.Tranche = tranche.id;
                    TrancheInfo.contractValue = contractValue;
                    TrancheInfo.timeStamp = event.block.timestamp;
                    TrancheInfo.totalSupply = tranche.totalSupply;
                    TrancheInfo.virtualPrice = trancheVirtualPrice;
                    TrancheInfo.save();
                }
            }
        }

    }
}