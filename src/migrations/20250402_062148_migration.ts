// import {
//   MigrateDownArgs,
//   MigrateUpArgs,
// } from '@payloadcms/db-mongodb'

// export async function up({ payload }: MigrateUpArgs): Promise<void> {
//   await payload.create({
//     collection: 'clients',
//     data: {
//       email: "saad@gmail.com",
//       username: "saadwadi",
//       password: '123456',
//       date: '2025-04-02',
//       time: '10:00 AM',
//       age: '30',
//       gender: 'Male',
//       heartRate: '72',
//       bloodPressure: '120/80',
//       temperature: '98.6',
//       oxygonSaturation: '98%',
//       reportedsymptoms: 'Dizziness',
//     }
//   })
//   // Migration code
// }

// export async function down({ payload }: MigrateDownArgs): Promise<void> {
//   await payload.delete({
//     collection: 'clients',
//     where: {
//       email: {
//         equals: 'saad@gmail.com',
//       },
//     },
//   })
// }
