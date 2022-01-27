import React from 'react';
import './Bird.css';

const Bird = ({ style }) => {
    return (
        <div className={"bird flying"} style={style}></div>
    )
}
export default Bird