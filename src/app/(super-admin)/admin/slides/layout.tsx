import React from 'react'
import { SlidesProvider } from './SlidesProvider'
import { ConfigurationInitializer } from './ConfigurationInitializer'
import { LayoutProvider } from './context/LayoutContext'

const SlidesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="slides-content">
      <SlidesProvider>
        <LayoutProvider>
          <ConfigurationInitializer>
            {children}
          </ConfigurationInitializer>
        </LayoutProvider>
      </SlidesProvider>
    </div>
  )
}

export default SlidesLayout
