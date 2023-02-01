const GAME_STATES = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

// Model
const model = {
  // 存放最新翻開的2張牌
  revealedCards: [],

  // 檢查翻開的兩張牌是否一樣
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.number % 13 ===
      this.revealedCards[1].dataset.number % 13;
  },

  score: 0,
  triedTimes: 0,

}


// VIEW
const view = {

  // 卡牌背面 ＋ 卡牌 dataset.number
  getCardElement(index) {
    return `   
     <div data-number="${index}" class="card back">
    </div>
    `
  },
  // 顯示卡牌正片
  getCardContain(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `   
      <p>${number}</p>
      <img src="${symbol}">
      <p>${number}</p>
    `
  },

  transformNumber(number) {
    switch (number) {
      case 1:
        return "A"
      case 11:
        return "J"
      case 12:
        return "Q"
      case 13:
        return "K"
      default:
        return number
    }
  },
  displayCard(indexes) {
    const cards = document.querySelector("#cards")
    //用join讓 array 變成一個 string
    cards.innerHTML = indexes.map(number => this.getCardElement(number)).join("")

  },

  flipCards(...cards) {
    cards.map(card => {
      //是蓋的話就打開
      if (card.classList.contains("back")) {
        card.innerHTML = this.getCardContain(Number(card.dataset.number)) //dataset回傳是string這邊改成Number
        card.classList.remove("back")
      } else {
        //是打開的話就蓋起來
        card.innerHTML = ""
        card.classList.add("back")
      }
    })
  },
  // 渲染成功配對卡片
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add("paired")
    })
  },

  // 顯示分數
  renderScore(score) {
    document.querySelector(".score").textContent = `score: ${score}`
  },

  // 顯示次數
  renderTriedTimes(times) {
    document.querySelector(".tried").textContent = `You've tried: ${times} times`
  },

  // 配對失敗動畫
  appendWrongAnimation(...cards) {
    cards.map(card => {
      // 加入wrong class
      card.classList.add("wrong");
      card.addEventListener("animationend", function onAnimationEnd(event) {
        card.classList.remove("wrong");
      }, { once: true })
    })
  },

  //顯示遊戲結束畫面
  showGameFinished(){
    const div = document.createElement("div")
    div.classList.add("completed")
    div.innerHTML = `
      <p>Completed!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
      <button id="restart">Restart</button>      
    `
    const header = document.querySelector("#header")
    header.before(div)

    // restart按鈕功能
    const button = document.querySelector("#restart")
    button.addEventListener("click", function onRestartClicked(event) {
      location.reload() //刷新頁面
    })
  },
}


// Utility
const utility = {
  getRandomNumberArray(count) {
    // 先做一個count長度的array,內容是keys
    const numberArray = Array.from(Array(count).keys())

    // 洗牌：從最後一個陣列開始隨機換卡，一直換到第二張卡
    for (let index = numberArray.length - 1; index > 0; index--) {
      // 選出 隨機卡片
      const randomIndex = Math.floor(Math.random() * (index - 1));
      // 把目前卡片跟 隨機卡片 對調
      [numberArray[index], numberArray[randomIndex]] = [numberArray[randomIndex], numberArray[index]]
    }
    return numberArray
  }
}

// Controller
const controller = {
  // 目前設定初始 game states
  currentState: GAME_STATES.FirstCardAwaits,

  // 生出初始52張卡片內容
  generateCards() {
    view.displayCard(utility.getRandomNumberArray(52))
  },

  // 翻牌
  dispatchCardAction(card) {
    // 卡片如果是翻開過的就直接忽視
    if (!card.classList.contains("back")) {
      return
    }

    // 依照目前 Game states 來做事情
    switch (this.currentState) {
      // 翻第一張牌
      case GAME_STATES.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATES.SecondCardAwaits
        break;

      // 翻第二張牌
      case GAME_STATES.SecondCardAwaits:
        view.renderTriedTimes(model.triedTimes += 1) //這裡把++放在前面
        view.flipCards(card)
        model.revealedCards.push(card)
        // 配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATES.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = [];
          // 要是分數是260分
          if (model.score === 260){
            this.currentState = GAME_STATES.GameFinished
            view.showGameFinished()
            return
          }
          // 沒有260分就繼續
          this.currentState = GAME_STATES.FirstCardAwaits;
        } else {
          // 配對失敗
          this.currentState = GAME_STATES.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break;
    }
    console.log('currentState:', this.currentState)
    console.log('revealedCards:', model.revealedCards.map(card => card.dataset.number))
  },

  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = [];
    // 這裡要特別寫上controller而不是用this, 因為這個是使用在setTimeout裡面,this不會指向controller
    controller.currentState = GAME_STATES.FirstCardAwaits;
  }

}

// ------------------- Start -------------------- //
// 開始時跑一次，生成卡片
controller.generateCards()

// 把每張卡片上都放一個 listener
document.querySelectorAll(".card").forEach(card =>
  card.addEventListener("click", function onCardClicked(event) {
    controller.dispatchCardAction(card)
  })
)