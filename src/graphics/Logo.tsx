import { Nabla } from 'next/font/google'

const nabla = Nabla({ subsets: ['latin'] })

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        className={nabla.className}
        style={{
          fontSize: 42,
        }}
      >
        Ratefreak
      </span>
    </div>
  )
}
