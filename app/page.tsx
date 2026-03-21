'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const UNLOCK_CODE = '062286'

type Op = '+' | '-' | '*' | '/' | null

export default function CalculatorPage() {
  const router = useRouter()
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState<string | null>(null)
  const [op, setOp] = useState<Op>(null)
  const [waitingForNext, setWaitingForNext] = useState(false)
  const [sequence, setSequence] = useState('')

  const checkUnlock = useCallback((seq: string) => {
    if (seq === UNLOCK_CODE) {
      router.push('/login')
    }
  }, [router])

  function inputDigit(d: string) {
    const newSeq = (sequence + d).slice(-6)
    setSequence(newSeq)
    checkUnlock(newSeq)

    if (waitingForNext) {
      setDisplay(d)
      setWaitingForNext(false)
    } else {
      setDisplay(display === '0' ? d : display.length >= 12 ? display : display + d)
    }
  }

  function inputDecimal() {
    setSequence('')
    if (waitingForNext) {
      setDisplay('0.')
      setWaitingForNext(false)
      return
    }
    if (!display.includes('.')) setDisplay(display + '.')
  }

  function clear() {
    setDisplay('0')
    setPrev(null)
    setOp(null)
    setWaitingForNext(false)
    setSequence('')
  }

  function toggleSign() {
    setSequence('')
    setDisplay(String(parseFloat(display) * -1))
  }

  function percentage() {
    setSequence('')
    setDisplay(String(parseFloat(display) / 100))
  }

  function chooseOp(nextOp: Op) {
    setSequence('')
    const current = parseFloat(display)
    if (prev !== null && op && !waitingForNext) {
      const result = calculate(parseFloat(prev), current, op)
      setDisplay(formatResult(result))
      setPrev(formatResult(result))
    } else {
      setPrev(display)
    }
    setOp(nextOp)
    setWaitingForNext(true)
  }

  function calculate(a: number, b: number, o: Op): number {
    if (o === '+') return a + b
    if (o === '-') return a - b
    if (o === '*') return a * b
    if (o === '/') return b === 0 ? 0 : a / b
    return b
  }

  function formatResult(n: number): string {
    if (!isFinite(n)) return 'Error'
    const s = parseFloat(n.toPrecision(10)).toString()
    return s.length > 12 ? parseFloat(n.toFixed(6)).toString() : s
  }

  function equals() {
    setSequence('')
    if (prev === null || op === null) return
    const result = calculate(parseFloat(prev), parseFloat(display), op)
    setDisplay(formatResult(result))
    setPrev(null)
    setOp(null)
    setWaitingForNext(true)
  }

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key)
      else if (e.key === '.') inputDecimal()
      else if (e.key === '+') chooseOp('+')
      else if (e.key === '-') chooseOp('-')
      else if (e.key === '*') chooseOp('*')
      else if (e.key === '/') { e.preventDefault(); chooseOp('/') }
      else if (e.key === 'Enter' || e.key === '=') equals()
      else if (e.key === 'Escape') clear()
      else if (e.key === 'Backspace') {
        setSequence('')
        setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const isActiveOp = (o: Op) => op === o && waitingForNext

  function fmt(val: string) {
    if (val === 'Error') return val
    const num = parseFloat(val)
    if (isNaN(num)) return val
    if (val.includes('.')) return val
    if (Math.abs(num) >= 1e10) return num.toExponential(3)
    return num.toLocaleString('en-US')
  }

  const displayLen = display.replace(/[^0-9]/g, '').length
  const fontSize = displayLen > 9 ? 'text-4xl' : displayLen > 6 ? 'text-5xl' : 'text-6xl'

  return (
    <div className="min-h-screen flex items-end justify-center"
      style={{ background: '#000' }}>
      <div className="w-full max-w-sm" style={{ userSelect: 'none' }}>

        {/* Display */}
        <div className="px-6 pb-3 pt-16 text-right">
          <div className={`font-light text-white ${fontSize} tracking-tight leading-none`}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
            {fmt(display)}
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-3 px-3 pb-10">
          <CalcBtn label={display !== '0' ? 'C' : 'AC'} color="func" onPress={clear} />
          <CalcBtn label="+/-" color="func" onPress={toggleSign} />
          <CalcBtn label="%" color="func" onPress={percentage} />
          <CalcBtn label="÷" color={isActiveOp('/') ? 'op-active' : 'op'} onPress={() => chooseOp('/')} />

          <CalcBtn label="7" color="num" onPress={() => inputDigit('7')} />
          <CalcBtn label="8" color="num" onPress={() => inputDigit('8')} />
          <CalcBtn label="9" color="num" onPress={() => inputDigit('9')} />
          <CalcBtn label="×" color={isActiveOp('*') ? 'op-active' : 'op'} onPress={() => chooseOp('*')} />

          <CalcBtn label="4" color="num" onPress={() => inputDigit('4')} />
          <CalcBtn label="5" color="num" onPress={() => inputDigit('5')} />
          <CalcBtn label="6" color="num" onPress={() => inputDigit('6')} />
          <CalcBtn label="−" color={isActiveOp('-') ? 'op-active' : 'op'} onPress={() => chooseOp('-')} />

          <CalcBtn label="1" color="num" onPress={() => inputDigit('1')} />
          <CalcBtn label="2" color="num" onPress={() => inputDigit('2')} />
          <CalcBtn label="3" color="num" onPress={() => inputDigit('3')} />
          <CalcBtn label="+" color={isActiveOp('+') ? 'op-active' : 'op'} onPress={() => chooseOp('+')} />

          <CalcBtn label="0" color="num" wide onPress={() => inputDigit('0')} />
          <CalcBtn label="." color="num" onPress={inputDecimal} />
          <CalcBtn label="=" color="op" onPress={equals} />
        </div>
      </div>
    </div>
  )
}

type BtnColor = 'func' | 'num' | 'op' | 'op-active'

function CalcBtn({ label, color, wide, onPress }: {
  label: string
  color: BtnColor
  wide?: boolean
  onPress: () => void
}) {
  const [pressed, setPressed] = useState(false)

  const bg = {
    func:        pressed ? '#d4d4d2' : '#a5a5a5',
    num:         pressed ? '#636366' : '#333333',
    op:          pressed ? '#ffd27a' : '#ff9f0a',
    'op-active': pressed ? '#ff9f0a' : '#ffd27a',
  }[color]

  const textColor = color === 'func' ? '#000' : '#fff'

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onPress() }}
      onPointerLeave={() => setPressed(false)}
      className={`flex items-center justify-center rounded-full ${wide ? 'col-span-2' : ''}`}
      style={{
        background: bg,
        color: textColor,
        height: '80px',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '28px',
        fontWeight: '400',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      {label}
    </button>
  )
}
