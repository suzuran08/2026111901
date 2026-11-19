let bgImg; // 儲存背景圖片
let bgX = 0; // 記錄背景目前的水平位移
let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

function preload() {
  bgImg = loadImage("BG/BG1.png"); // 載入背景圖片
  characterSprite = loadImage("1/stop/stop.png"); // 載入角色一的十格精靈圖
  walkSprite = loadImage("1/walk/walk.png"); // 載入角色一的九格走路精靈圖
  magicSprite = loadImage("1/magic/magic.png"); // 載入角色一的四格施法精靈圖
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png"); // 載入五格魔法特效精靈圖
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  characterX = width / 2; // 將角色預設初始位置設在畫布中央
  frameRate(60);
}

function draw() {
  background(0);

  // 計算等比例縮放至畫布高度的單張背景寬度（若三張小於視窗寬度則自適應撐滿）
  let bgScale = height / bgImg.height;
  let singleBgWidth = bgImg.width * bgScale;
  if (singleBgWidth * 3 < width) {
    singleBgWidth = width / 3;
  }
  const totalBgWidth = singleBgWidth * 3; // 三張背景串接總寬度
  const maxScroll = max(0, totalBgWidth - width); // 修正：精準計算背景最多能向左捲動的距離，避免右側露黑

  const movingRight = keyIsDown(RIGHT_ARROW);
  const movingLeft = keyIsDown(LEFT_ARROW);
  isWalking = movingRight || movingLeft;

  const movementStep = constrain(width * 0.004, 2, 8); // 移動速度

  // 角色縮放比例（高度為畫布高度的 1/3，並等比例縮放寬度）
  const characterScale = (height / 3) / frameHeight;
  const characterWidth = frameWidth * characterScale;
  const characterHeight = frameHeight * characterScale;

  // 鍵盤移動與捲動控制邏輯
  if (movingRight) {
    facingDirection = 1;
    // 背景尚未捲動至最右端極限時（bgX 還大於 -maxScroll），背景持續往左移
    if (bgX > -maxScroll) {
      bgX -= movementStep;
      if (bgX < -maxScroll) {
        bgX = -maxScroll; // 到達背景最右邊界，不讓黑邊露出
      }
    } else {
      // 背景已到最右邊界，背景暫停捲動，改由角色向右走
      characterX += movementStep;
    }
  } else if (movingLeft) {
    facingDirection = -1;
    // 背景尚未捲動回最左端（bgX < 0），背景往右移
    if (bgX < 0) {
      bgX += movementStep;
      if (bgX > 0) {
        bgX = 0; // 回到背景最左邊界
      }
    } else {
      // 背景已到最左邊界，背景暫停捲動，改由角色向左走
      characterX -= movementStep;
    }
  }

  // 限制角色不超出畫布兩側邊界
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // 繪製串聯的 3 張背景圖片
  imageMode(CORNER);
  for (let i = 0; i < 3; i++) {
    // 加上 +1 像素微量重疊，消除浮點數縮放時可能產生的極細接縫
    image(bgImg, bgX + i * singleBgWidth, 0, singleBgWidth + 1, height);
  }

  // 處理施法動畫結束與特效發射
  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({
      x: characterX + magicDirection * characterWidth / 2,
      y: height - characterHeight * 0.58,
      direction: magicDirection
    });
  }

  // 選擇角色當前動作影格
  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth;
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight;

  const elapsedMagicFrames = frameCount - magicStartFrame;
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount;
  const sourceX = frameIndex * activeFrameWidth;
  const activeWidth = activeFrameWidth * characterScale;
  const activeHeight = activeFrameHeight * characterScale;
  const characterY = height - activeHeight / 2;

  // 繪製角色（切回 CENTER 模式便於水平翻轉與置底定位）
  imageMode(CENTER);
  push();
  translate(characterX, characterY);
  scale(isCasting ? magicDirection : facingDirection, 1);
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight);
  pop();

  // 繪製並更新魔法特效
  const effectScale = characterScale;
  const effectWidth = effectFrameWidth * effectScale;
  const effectHeight = effectFrameHeight * effectScale;
  const effectSpeed = max(6, width * 0.008);

  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) {
    const effect = activeEffects[effectIndex];
    effect.x += effect.direction * effectSpeed;

    if (effect.x > width || effect.x < 0) {
      activeEffects.splice(effectIndex, 1);
      continue;
    }

    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount;
    push();
    translate(effect.x, effect.y);
    scale(effect.direction, 1);
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight);
    pop();
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    isWalking = true;
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    isWalking = true;
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) {
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  characterX = constrain(characterX, 1, width - 1);
}