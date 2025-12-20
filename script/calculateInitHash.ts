// scripts/getPoolInitCodeHash.ts
// You need to find where is the UniswapV3Pool bytecode
import { bytecode } from "../out/UniswapV2Pair.sol/UniswapV2Pair.json"
import { keccak256 } from "ethers";

function getPoolInitCodeHash() {
 const COMPUTED_INIT_CODE_HASH = keccak256(bytecode.object) 
 console.log(COMPUTED_INIT_CODE_HASH) 
}

getPoolInitCodeHash()