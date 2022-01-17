import * as bip39 from 'bip39'
import HDKey from 'hdkey'
import {ec as EC} from 'elliptic'
import bs58check from 'bs58check'
import {randomBytes} from 'crypto'
import QRCode from 'qrcode'

const DEFAULT_ENTROPY_BYTES = 16
const DESO_PREFIX = [0xcd, 0x14, 0x0]

// TODO bitaddress.org and support 24-word phrases
const generateEntropy = () => {
  const entropy = randomBytes(DEFAULT_ENTROPY_BYTES)
  return entropy.toString('hex')
}

const generateMnemonic = (entropy) => {
  return bip39.entropyToMnemonic(entropy)
}

const isValidMnemonic = (mnemonic) => {
  try {
    bip39.mnemonicToEntropy(mnemonic)
  } catch {
    return false
  }
  return true
}

const mnemonicToKeychain = (mnemonic, password) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic, password)
  return HDKey.fromMasterSeed(seed).derive('m/44\'/0\'/0\'/0/0')
}

const privateKeyToDeSoPublicKey = (privateKey) => {
  const key = privateKey.getPublic().encode('array', true)
  const prefixAndKey = Buffer.from([...DESO_PREFIX, ...key])
  return bs58check.encode(prefixAndKey)
}

const loadQrCode = (url) => {
  const qr = document.getElementById('qr')
  return QRCode.toDataURL(url)
    .then(url => {
      qr.src = url
    })
    .catch(() => {
      qr.remove()
    })
}

const generateWallet = () => {
  let mnemonicElement = document.getElementById('mnemonic')
  const mnemonic = mnemonicElement.value

  if (!isValidMnemonic(mnemonic)) {
    alert('Invalid mnemonic')
    return
  }

  let passwordElement = document.getElementById('password')
  const password = passwordElement.value

  const keychain = mnemonicToKeychain(mnemonic, password)
  const ec = new EC('secp256k1')
  const privateKey = ec.keyFromPrivate(keychain.privateKey)
  const publicKeyBase58Check = privateKeyToDeSoPublicKey(privateKey)

  const publicKeyElement = document.getElementById('public-key')
  if (publicKeyElement) {
    publicKeyElement.innerText = publicKeyBase58Check
  }

  const url = `https://node.deso.org/send-deso?public_key=${publicKeyBase58Check}`

  const imgLinkElement = document.getElementById('img-link')
  imgLinkElement.href = url

  document.getElementById('generated').style.display = 'inherit'
  mnemonicElement.disabled = true
  mnemonicElement.style.border = 'none'

  if (password) {
    passwordElement.disabled = true
    passwordElement.style.border = 'none'
  } else {
    passwordElement.remove()
    document.querySelector("label[for=" + passwordElement.id + "]").remove()
  }

  const submitButton = document.getElementById('submit')
  submitButton.remove()

  const refreshButton = document.getElementById('refresh-mnemonic')
  refreshButton.remove()

  const text = JSON.stringify(keychain.toJSON())
  const element = document.getElementById('download');
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', `${publicKeyBase58Check}.json`);

  loadQrCode(url)
    .then(() => {
      location.hash = '#generated'
    })
}

const copyPublicKey = () => {
  const publicKey = document.getElementById('public-key').innerText
  navigator.clipboard.writeText(publicKey)
    .then(() => {
      const copyBtn = document.getElementById('copy')
      copyBtn.innerText = '✓'
      copyBtn.disabled = true

      window.setTimeout(() => {
        copyBtn.innerText = 'Copy'
        copyBtn.disabled = false
      }, 2000)
    })
    .catch(console.error)
}

const refreshMnemonic = () => {
  const entropy = generateEntropy()
  const mnemonic = generateMnemonic(entropy)

  const mnemonicField = document.getElementById('mnemonic')
  mnemonicField.value = mnemonic
}

function checkAndWarn() {
  const warningElement = document.getElementById('warning')
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  if (location.hostname !== 'localhost'
    && location.hostname !== '127.0.0.1'
    && location.protocol !== 'file:'
    && !(isStandalone || navigator.standalone)
  ) {
    const a = document.createElement('a')
    a.href = 'https://github.com/iPaulPro/deso-wallet-generator/releases/latest'
    a.target = '_blank'
    a.rel = 'noopener'
    a.innerText = 'Download'

    const span = document.createElement('span')
    span.innerText = '⚠️ It is recommended to run this generator offline as a local file! '
    span.appendChild(a)

    warningElement.appendChild(span)
    warningElement.classList.remove('none')
  } else if (navigator.onLine) {
    warningElement.innerText = 'It is recommended to run this generator offline.'
    warningElement.classList.remove('none')
  }
}

const submitButton = document.getElementById('submit')
submitButton.onclick = generateWallet

const copyButton = document.getElementById('copy')
copyButton.onclick = copyPublicKey

const refreshButton = document.getElementById('refresh-mnemonic')
refreshButton.onclick = refreshMnemonic

refreshMnemonic()

checkAndWarn()

window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
  if (evt.matches) {
    checkAndWarn()
  }
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(console.error)
  })
}