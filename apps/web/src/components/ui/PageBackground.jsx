"use client"

const PageBackground = () => {
  return (
    <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
      {/* Primary gradient (top-left) */}
      <div 
        className="absolute -top-[20vh] -left-[20vw] w-[140vw] h-[140vh] opacity-90"
        style={{
          background: `radial-gradient(
            ellipse at 20% 20%,
            var(--gradient-primary-start, rgba(147, 51, 234, 0.15)),
            var(--gradient-primary-mid, rgba(147, 51, 234, 0.08)) 35%,
            var(--gradient-primary-end, transparent) 70%
          )`,
          filter: 'blur(60px)',
        }}
      />
      
      {/* Secondary gradient (bottom-right) */}
      <div 
        className="absolute -bottom-[20vh] -right-[20vw] w-[140vw] h-[140vh] opacity-90"
        style={{
          background: `radial-gradient(
            ellipse at 80% 80%,
            var(--gradient-secondary-start, rgba(37, 99, 235, 0.15)),
            var(--gradient-secondary-mid, rgba(37, 99, 235, 0.08)) 35%,
            var(--gradient-secondary-end, transparent) 70%
          )`,
          filter: 'blur(60px)',
        }}
      />
      
      {/* Optional accent gradient (center) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] opacity-40"
        style={{
          background: `radial-gradient(
            circle at center,
            var(--gradient-accent-start, rgba(99, 102, 241, 0.08)),
            var(--gradient-accent-mid, rgba(99, 102, 241, 0.04)) 30%,
            var(--gradient-accent-end, transparent) 60%
          )`,
          filter: 'blur(80px)',
        }}
      />
    </div>
  )
}

export default PageBackground 