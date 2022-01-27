import React, { useState, useEffect, useRef } from 'react'
import GameParamters from './utils/GameSetting';
import './Game.css';
import Bird from "./components/Bird"
import Menu from "./components/Menu"
import Pipe from "./components/Pipe"
import Webcam from "react-webcam";
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { drawCanvas } from "./utils/canvasUtils";

const Game = ({ setPrePare }) => {
  // bird的初始狀態
  const birdInitialState = {
    height: GameParamters.bird.initialHeight,
  }

  // pipe的初始狀態
  const pipeInitialState = {
    list: [],
    lastCreateTime: 0
  }

  // flappy bird
  const playRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const birdRef = useRef(birdInitialState)
  const [style, setStlye] = useState({ transform: `translate(0, ${-GameParamters.bird.initialHeight}px)` })  // 控制bird的css，正數為下方，負數為上方
  const pipeRef = useRef(pipeInitialState)
  const [pipeList, setPipeList] = useState([])
  const scoreRef = useRef(0)
  const [score, setScore] = useState(0)

  // webcam and canvas
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const flapRef = useRef(false)


  // MoveNet偵測身體動作並及時繪製
  const detect = async (detector) => {
    if (typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4) {
      // Video Property
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Video width-height
      webcamRef.current.video.width = videoWidth
      webcamRef.current.video.height = videoHeight

      //Detect Pose
      const pose = await detector.estimatePoses(video)
      // pose[0].keypoints[9] // 左手掌
      // pose[0].keypoints[10] // 右手掌
      if (pose[0].keypoints[10].y <= pose[0].keypoints[6].y && pose[0].keypoints[9].y <= pose[0].keypoints[5].y) {
        flapRef.current = false
        console.log(flapRef.current)
      } else if (pose[0].keypoints[10].y > pose[0].keypoints[6].y && pose[0].keypoints[9].y > pose[0].keypoints[5].y && flapRef.current === false) {
        flapRef.current = true
        flap()
        console.log(flapRef.current)
      }
      // 繪製偵測點
      drawCanvas(pose, videoWidth, videoHeight, canvasRef, flapRef)

      // 畫完canvas後更新detecting
      if (!detecting) {
        setDetecting(true)
      }
    }
  }

  useEffect(() => {
    let detector
    (async () => {
      const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER };
      detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
      setLoading(false)
    })()

    const startGame = setInterval(() => {
      detect(detector)
      if (playRef.current) {
        // bird
        if (birdRef.current.height >= 10) {
          birdRef.current.height = birdRef.current.height - 10  //等速下降
          setStlye({ transform: `translate(0, ${-birdRef.current.height}px)` })
        }

        // pipe
        const now = Date.now()  // 此刻時間
        if (pipeRef.current.lastCreateTime === 0) {
          pipeRef.current.lastCreateTime = now
        }
        if (now - pipeRef.current.lastCreateTime >= GameParamters.pipings.timeInterval) {
          creatNewPipe(now)
        }
        // 隨時更新pipeRef.list
        UpdatePipeList(now)

        // 偵測得分
        scoreDetection()

        // 偵測碰撞
        collisionDetection()
      }
    }, 100)
    return () => clearInterval(startGame)

  }, [playing,])


  // 創建一根新的pipe加入pipeRef.current.list
  const creatNewPipe = (now) => {
    const pipeLowerShift = GameParamters.pipings.shiftRange.y.min + (GameParamters.pipings.shiftRange.y.max - GameParamters.pipings.shiftRange.y.min) * Math.random()  // 下排pipe向上平移量
    const pipeUpperShift = GameParamters.heightLimit - pipeLowerShift - GameParamters.pipings.gap  // by 下排pipe向上平移量 + 上排pipe向下平移量 + gap = ground到天空的長度
    const newPipe = {
      createTime: now,  // 此pipe創建時間
      x: 0,  // 初始位置
      pipeLowerShift: pipeLowerShift,  // 下排pipe向上平移量
      pipeUpperShift: pipeUpperShift,  // 上排pipe向下平移量
      topOfPipeLower: 0 + pipeLowerShift,  //下排管子的頭部
      bottomOfPipeUpper: 0 + pipeLowerShift + GameParamters.pipings.gap,  //上管子的底部
      isPassed: false
    }
    pipeRef.current.list = pipeRef.current.list.concat(newPipe)
    pipeRef.current.lastCreateTime = now
    setPipeList(pipeRef.current.list)  //更新 pipeList state，
  }

  // 更新pipeReflist中每個pipe的位置
  const UpdatePipeList = (now) => {
    const pipeList = [...pipeRef.current.list]
    // console.log(pipeList)
    pipeList.map(pipe => {
      // 若該pipe還沒超出畫面就更新該pipe.x
      if (pipe.x < GameParamters.pipings.shiftRange.x.max) {
        let ratio = (now - pipe.createTime) / GameParamters.pipings.speed  // 該比例代表現在該管子在通往盡頭路程的百分比
        if (ratio > 1) {
          ratio = 1  // 最多就是讓pipe.x = 遊戲畫面最左側
        }
        pipe.x = ratio * GameParamters.pipings.shiftRange.x.max
      } else {
        pipe.x = GameParamters.pipings.shiftRange.x.max
      }
      return pipe
    }).filter(pipe => {  // 濾掉那些已經超過畫面的pipe
      return pipe.x < GameParamters.pipings.shiftRange.x.max
    })
    pipeRef.current.list = pipeList
    setPipeList(pipeRef.current.list)  //更新 pipeList state，
  }

  // 偵測碰撞
  const collisionDetection = () => {
    const pipeList = [...pipeRef.current.list]
    pipeList.map(pipe => {
      // 過濾出bird正在穿越的pipe
      if (pipe.x > GameParamters.pipings.interactionX.head && pipe.x < GameParamters.pipings.interactionX.end) {
        const birdBottom = birdRef.current.height
        const birdTop = birdRef.current.height + GameParamters.bird.height
        if (birdBottom < pipe.topOfPipeLower - 2 || birdTop > pipe.bottomOfPipeUpper + 2) {
          playRef.current = false;  // 控制bird不再下降
          setPlaying(false)  // 控制遊戲state
        }
      }
      return pipe
    })
  }

  // 偵測得分
  const scoreDetection = () => {
    const pipeList = [...pipeRef.current.list]
    pipeList.map(pipe => {
      if (pipe.x > GameParamters.pipings.interactionX.end && !pipe.isPassed) {
        pipe.isPassed = true
        scoreRef.current = scoreRef.current + 1 //更新分數
        setScore(scoreRef.current)  // 用useRef更新useState
      }
      return pipe
    })
  }

  const onPlay = () => {
    // 初始所有狀態
    birdRef.current = { ...birdInitialState }
    pipeRef.current = { ...pipeInitialState }
    scoreRef.current = 0
    setStlye({ transform: `translate(0, ${-birdRef.current.height}px)` })
    setPipeList(pipeRef.current.list)
    setScore(0)

    // 開始遊戲
    playRef.current = true
    setPlaying(true)
  }

  // bird 跳起，可以綁定滑鼠點擊或是豁動手臂動作
  const flap = () => {
    if (playRef.current && playing)
      birdRef.current.height = birdRef.current.height + 80
    setStlye({ transform: `translate(0, ${-birdRef.current.height}px)` })
  }


  return (
    <div className="background" onMouseDown={flap}>
      <h3 className="loading-status">{
        !playing ?
          loading ? "Loading MoveNet..." :
            detecting ? "MoveNet is ready, plseae enjoy the game !" :
              "MoveNet is detecting your pose, please wait a moment..." :
          "Wave your arm !"
      }</h3>
      <div className="container" >
        <div className="gameWrapper">
          <div className="game">
            <div className="scene" >
              {(playing) ? <div className="score">{score}</div> : ""}
              <Bird style={style} />
              {
                pipeList.map(pipe => <Pipe key={pipe.createTime} x={pipe.x} pipeLowerShift={pipe.pipeLowerShift} pipeUpperShift={pipe.pipeUpperShift} />)
              }
              <div className={playing ? "ground sliding" : "ground"}></div>
              <Pipe />
              {(!playing) ? <Menu onPlay={onPlay} score={score} /> : ""}
            </div>
          </div>
        </div>
        <div className="videoWrapper">
          <Webcam ref={webcamRef} className="video" />
          <canvas ref={canvasRef} className="video" />
        </div>
      </div>
      <div className="btn-container">
        <button className="btn" onClick={() => { setPrePare(false) }}>Back</button>
        <button className="btn" onClick={() => { onPlay() }}>Play</button>
      </div>
    </div>

  );
}

export default Game;
