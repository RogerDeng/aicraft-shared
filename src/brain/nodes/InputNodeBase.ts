/**
 * Created by user1a on 2/28/18.
 */
import {  Enum  } from '../../Enum'
import * as _ from 'underscore'
import { NodeBase } from './NodeBase'
import { InputNodeTarget } from '../InputNodeTarget'
//import { TickEvent } from "../TickEvent";
import { NodeEvaluateResult } from "../NodeEvaluateResult"
interface iTickEvent{
    constructor(options:any);
    type:string;
    data:Array<any>;
}
class InputNodeBase extends NodeBase{
    protected _target:InputNodeTarget = null;
    constructor (options){
        super(options);
        if(!this.rawNode.target){
            //IDK...
        }
        this._target = new InputNodeTarget({
            node:this,
            rawTargetData: this.rawNode.target
        });

    }

    searchTickEvents(filter:any):Array<iTickEvent>{
        let results = [];
        this.brain.app.tickEvents.forEach((tickEvent:iTickEvent)=>{
            if(_.isString(filter)) {
                if (tickEvent.type !== filter) {
                    return false;
                }
            }else if(_.isFunction(filter)){
                if(!filter(tickEvent)){
                    return false;
                }
            }else{
                throw new Error("Invalid `filter` parameter")
            }
            results.push(tickEvent);

        })
       /* if(results.length > 0){
            console.log("Results:", results)
        }*/
        return results;
    }
    evaluate():NodeEvaluateResult{
        let results:NodeEvaluateResult = null;
        switch(this.type){
            case(Enum.InputTypes.canDigBlock):
                results = this.canDigBlock();
            break
            case(Enum.InputTypes.hasInInventory):
                results = this.hasInInventory();
                break
            case(Enum.InputTypes.canSeeEntity):
                results = this.canSeeEntity();
            break;
            case(Enum.InputTypes.canSeeBlock):
                results = this.canSeeBlock();
            break;
            case(Enum.InputTypes.hasInInventory):
                results = this.hasInInventory();
            break;
            case(Enum.InputTypes.chat):
                results = this.chat();
            break;
            case(Enum.InputTypes.onCorrelateAttack):
                results = this.onCorrelateAttack();
            break;
            default:
                throw new Error("Invalid `InputNodeBase.type`: " + this.type)
        }
        return results;
    }
    canDigBlock():NodeEvaluateResult{
        let startDate = new Date().getTime();
        let blocks = this._target.findBlock({
            count: 20
        })
        let results = [];

        blocks.forEach((block)=>{
            if(!this.brain.bot.canDigBlock(block)){
                return false;
            }
            results.push(block);
        })
        //console.log("TIME:", (new Date().getTime() - startDate)/1000);
        return new NodeEvaluateResult({
            score: results.length > 0 ? 1 : 0,
            results: results,
            node:this
        });
    }
    onCorrelateAttack():NodeEvaluateResult{

        let results:Array<iTickEvent> = this.searchTickEvents('onCorrelateAttack');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let attacker = result.data[0];
            let victim = result.data[1];
            let weapon = result.data[2];
            //TODO: Filter against victim and weapon?
            score += 1;
            targets.push(attacker);

        })
        return new NodeEvaluateResult({
            score :results.length > 0 ? 1  : 0,
            results: targets,
            node:this
        });
    }
    hasInInventory():NodeEvaluateResult{

        let results = this._target.findInventory();
        return new NodeEvaluateResult({
            score :results.length > 0 ? 1 : 0,
            results: results,
            node:this
        });
    }
    /**
     * Returns a 1 or a 0 based on weither or not the player can see the position we are describing
     */
    canSeeEntity():NodeEvaluateResult{
        let targetResults = this._target.findEntity();

        if(targetResults.length == 0){
            return new NodeEvaluateResult({
                score: 0,
                node:this
            });
        }
        return new NodeEvaluateResult({
            score :1,
            results: targetResults,
            node:this
        });

    }

    canSeeBlock():NodeEvaluateResult{
        let targetResults:Array<any> = this._target.findBlock();

        return new NodeEvaluateResult({
            score :targetResults.length > 0 ? 1 : 0,
            results: targetResults,
            node:this
        });
    }

    chat():NodeEvaluateResult{
        let results:Array<iTickEvent> = this.searchTickEvents('chat');
        let score = 0;
        let targets = [];
        results.forEach((result)=> {
            let username = result.data[0];
            let message = result.data[1];
            //TODO: make this a regex thing
            if(this._target.match({ value: message })){
                score += 1;
                targets.push(this.brain.bot.players[username].entity);
            }
        })
        return new NodeEvaluateResult({
           score: score,
           results: targets,
           node: this
        });
    }
}
export { InputNodeBase }