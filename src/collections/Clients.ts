import type { CollectionConfig } from 'payload'

export const Clients: CollectionConfig = {
    slug: 'clients',
    admin: {
        useAsTitle: 'email',
    },
    access: {
        create: () => true,
        read: () => true,
        update: () => true,
    },
    fields: [
        {
            name: 'username',
            type: 'text',
            required: true,
        },
        {
            name: 'email',
            type: 'email',
            required: true,
            unique: true,
        },
        {
            name: 'fullName',
            type: 'text',
            required: false,
        },
        {
            name: 'healthConcern',
            type: 'text',
            required: false,

        }, {
            name: 'messages',
            type: 'array',
            fields: [{ name: "message", type: "text" }],
            required: false,
        }, {
            name: 'phone',
            type: 'text',
            required: false,
        },
        {
            name: 'date',
            type: 'text',
            required: false,
        },
        {
            name: 'time',
            type: 'text',
            required: false,
        },
        {
            name: 'age',
            type: 'text',
            required: false,
        },
        {
            name: 'gender',
            type: 'text',
            required: false,
        },
        {
            name: 'heartRate',
            type: 'text',
            required: false,
        },
        {
            name: 'bloodPressure',
            type: 'text',
            required: false,
        },
        {
            name: 'temperature',
            type: 'text',
            required: false,
        },
        {
            name: 'oxygonSaturation',
            type: 'text',
            required: false,
        },
        {
            name: 'reportedsymptoms',
            type: 'text',
            required: false,
        },

    ],
}
