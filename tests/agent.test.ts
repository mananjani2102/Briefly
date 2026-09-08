import { describe, expect, it } from 'vitest'
import { describeTool } from '../src/lib/agent/describe'
import { AGENT_TOOLS } from '../src/lib/agent/tools'

describe('agent tools and descriptions', () => {
  it('includes get_element_text and wait_for_selector in AGENT_TOOLS', () => {
    const getTextTool = AGENT_TOOLS.find((t) => t.name === 'get_element_text')
    expect(getTextTool).toBeDefined()
    expect(getTextTool?.input_schema?.required).toContain('element_id')

    const waitTool = AGENT_TOOLS.find((t) => t.name === 'wait_for_selector')
    expect(waitTool).toBeDefined()
    expect(waitTool?.input_schema?.required).toContain('selector')
  })

  it('describes get_element_text tool accurately', () => {
    const desc = describeTool('get_element_text', { element_id: 14 })
    expect(desc.icon).toBe('page')
    expect(desc.label).toBe('Reading text of [14]')
  })

  it('describes wait_for_selector tool accurately', () => {
    const desc = describeTool('wait_for_selector', { selector: '.search-results > li' })
    expect(desc.icon).toBe('clock')
    expect(desc.label).toContain('Waiting for .search-results > li')
  })

  it('describes other core agent tools with expected icons and truncated labels', () => {
    expect(describeTool('read_page', {}).label).toBe('Reading the page')
    expect(describeTool('screenshot', {}).icon).toBe('camera')
    expect(describeTool('click', { element_id: 5 }).label).toBe('Clicking [5]')
    expect(describeTool('type_text', { text: 'Hello world' }).label).toContain('Typing “Hello world”')
    expect(describeTool('scroll', { direction: 'down' }).label).toBe('Scrolling down')
    expect(describeTool('scroll', { element_id: 9 }).label).toBe('Scrolling to [9]')
    expect(describeTool('navigate', { url: 'https://example.com' }).label).toContain('example.com')
  })
})
