import { describe, expect, it } from 'vitest'
import { spelService } from '../spel-service'
import { buildArrayMeta, buildEntries, buildTypeMap } from '../components/SpelEditor/spel-completions'

const globals = {
  resource: { owner: 'alice', tags: [{ name: 'admin' }] },
  env: { enabled: true },
}

describe('root context namespaces', () => {
  it('evaluates root fields with authentication, principal, and local variables', () => {
    spelService.setContext({ name: 'alice' }, { id: 7 }, globals)
    expect(spelService.eval("resource.owner == 'alice' and env.enabled == true")).toBe(true)
    expect(spelService.eval("authentication.name == 'alice' and principal.id == #id", { id: 7 })).toBe(true)
  })

  it('offers nested root fields and array metadata for completion', () => {
    const entries = buildEntries(undefined, undefined, undefined, undefined, undefined, globals)
    expect(entries.map((entry) => entry.label)).toEqual(expect.arrayContaining([
      'resource', 'resource.owner', 'resource.tags', 'env.enabled',
    ]))
    expect(buildTypeMap(undefined, undefined, undefined, globals)).toMatchObject({
      'resource.owner': 'string', 'resource.tags': 'array', 'env.enabled': 'boolean',
    })
    expect(buildArrayMeta(undefined, undefined, undefined, globals)['resource.tags']).toMatchObject({
      elementType: 'object', elementFields: [{ label: 'name', value: 'name', type: 'string' }],
    })
  })
})
