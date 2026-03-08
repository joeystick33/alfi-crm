declare module 'puppeteer' {
  interface LaunchOptions {
    headless?: boolean | 'new'
    args?: string[]
    executablePath?: string
  }
  interface WaitForOptions {
    timeout?: number
  }
  interface Viewport {
    width: number
    height: number
    deviceScaleFactor?: number
  }
  interface PDFOptions {
    format?: string
    printBackground?: boolean
    margin?: { top?: string; right?: string; bottom?: string; left?: string }
    displayHeaderFooter?: boolean
    preferCSSPageSize?: boolean
    headerTemplate?: string
    footerTemplate?: string
    path?: string
    tagged?: boolean
    [key: string]: unknown
  }
  interface Page {
    setContent(html: string, options?: { waitUntil?: string | string[]; timeout?: number }): Promise<void>
    pdf(options?: PDFOptions): Promise<Uint8Array>
    close(): Promise<void>
    waitForFunction(fn: () => unknown, options?: WaitForOptions): Promise<unknown>
    setViewport(viewport: Viewport): Promise<void>
    evaluate<T = unknown>(fn: (...args: any[]) => T, ...args: any[]): Promise<T>
    goto(url: string, options?: { waitUntil?: string | string[]; timeout?: number }): Promise<unknown>
  }
  export interface Browser {
    newPage(): Promise<Page>
    close(): Promise<void>
    connected: boolean
  }
  const puppeteer: {
    launch(options?: LaunchOptions): Promise<Browser>
  }
  export default puppeteer
}
