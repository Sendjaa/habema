"use client"

import { Suspense } from 'react'
import { EditAddressForm } from './EditAddressForm'

export default function EditAddressPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditAddressForm />
    </Suspense>
  )
}