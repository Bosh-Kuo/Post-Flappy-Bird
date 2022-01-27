import React, { useState } from 'react'
import Game from './Game';
import Instruction from './Instruction';

const GamePage = () => {
    const [prepare, setPrePare] = useState(false)
    return (
        (!prepare )? <Instruction setPrePare={setPrePare}/> : <Game setPrePare={setPrePare}/>
    )
}
export default GamePage