const gameHeight = 512;
const gameWidth = 400;
const groundHeight = 112;
const pipeWidth = 52;
const pipeUpperHeight = 270;
const pipeLowerHeight = 242;
const birdWidth = 34
const birdHeight = 34


const GameParamters = {
    heightLimit: gameHeight - groundHeight,  // 從ground起算到天空的長度
    bird: {
        initialHeight: 188,  // 遊戲初始bird從ground向上平移量
        heightRange: {  // bird從ground為0起算的高度範圍
            min: 0,
            max: gameHeight - groundHeight
        },
        width: birdWidth,
        height: birdHeight
    },
    pipings: {
        timeInterval: 1600*2,  //創建管子的時間間隔，自己設定
        speed: 2000,  // 管子移動速度（愈大移動愈慢）
        shiftRange: {  // 下排管子為平移range
            x: {
                min: 0,  //畫面最右側
                max: gameWidth + pipeWidth,  //管子埋進畫面最左側(288 + 52 = 340)
            },
            y: {  //下排管子向上平移量範圍
                min: 40,  // 自己設
                max: pipeLowerHeight,  // 下排管子最大平移量為下排管子長度
            },
        },
        gap: (gameHeight - groundHeight) - pipeLowerHeight,  // 上下管子間的空隙大小，(最大只能到(gameHeight - groundHeight) - pipeLowerHeight) = 512 - 112 - 242 = 152
        interactionX: {
            head: (gameWidth - birdWidth) / 2,  // 鳥頭部的x座標(畫面右側為0)
            end: (gameWidth - birdWidth) / 2 + pipeWidth + birdWidth  //鳥的中心線穿越了整根管子時管子的x座標
        }
    }
}
export default GameParamters