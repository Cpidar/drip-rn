const TemperatureSchema = {
  title: 'Temperature',
  version: 0,
  type: 'object',
  properties: {
    value: {
      type: number
    },
    exclude: {
      type: 'boolean'
    },
    time: {
      type: 'string',
    },
    note: {
      type: 'string',
    }
  },
  required: ['value', 'exclude']
}

const BleedingSchema = {
  name: 'Bleeding',
  properties: {
    value: {
      type: 'integer'
    },
    exclude: {
      type: 'boolean'
    }
  },
  required: ['value', 'exclude']
}

const MucusSchema = {
  name: 'Mucus',
  properties: {
    feeling: {
      type: 'integer'
    },
    texture: {
      type: 'integer'
    },
    value: {
      type: 'integer'
    },
    exclude: {
      type: 'boolean'
    }
  },
  required: ['feeling', 'texture', 'value', 'exclude']
}

const CervixSchema = {
  name: 'Cervix',
  properties: {
    opening: {
      type: 'integer'
    },
    firmness: {
      type: 'integer'
    },
    position: {
      type: 'integer',
    },
    exclude: {
      type: 'boolean'
    }
  },
  required: ['opening', 'firmness', 'exclude']
}

const NoteSchema = {
  name: 'Note',
  properties: {
    value: {
      type: 'string'
    }
  },
  required: ['value']
}

const DesireSchema = {
  name: 'Desire',
  properties: {
    value: {
      type: 'integer'
    }
  },
  required: ['value']
}

const SexSchema = {
  name: 'Sex',
  properties: {
    solo: { type: 'boolean' },
    partner: { type: 'boolean' },
    condom: { type: 'boolean' },
    pill: { type: 'boolean' },
    iud: { type: 'boolean' },
    patch: { type: 'boolean' },
    ring: { type: 'boolean' },
    implant: { type: 'boolean' },
    other: { type: 'boolean' },
    note: { type: 'string' }
  }
}

const PainSchema = {
  name: 'Pain',
  properties: {
    cramps: { type: 'boolean' },
    ovulationPain: { type: 'boolean' },
    headache: { type: 'boolean' },
    backache: { type: 'boolean' },
    nausea: { type: 'boolean' },
    tenderBreasts: { type: 'boolean' },
    migraine: { type: 'boolean' },
    other: { type: 'boolean' },
    note: { type: 'string' }
  }
}

const CycleDaySchema = {
  name: 'CycleDay',
  primaryKey: 'date',
  properties: {
    date: {
      type: 'string'
    },
    temperature: {
      type: 'Temperature' },
    bleeding: {
      type: 'Bleeding' },
    mucus: {
      type: 'Mucus' },
    cervix: {
      type: 'Cervix' },
    note: {
      type: 'Note' },
    desire: {
      type: 'Desire' },
    sex: {
      type: 'Sex' },
    pain: {
      type: 'Pain' }
  }
}

export default {
  schema: [
    CycleDaySchema,
    TemperatureSchema,
    BleedingSchema,
    MucusSchema,
    CervixSchema,
    NoteSchema,
    DesireSchema,
    SexSchema,
    PainSchema
  ],
  schemaVersion: 0
}
