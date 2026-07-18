import { useState, type FormEvent } from 'react'
import { db } from '../db/database'
import type { Asset } from '../db/types'

export function EditAssetDetailsSheet({
  asset,
  onClose,
}: {
  asset: Asset
  onClose: () => void
}) {
  const [purchaseDate, setPurchaseDate] = useState(asset.purchaseDate ?? '')
  const [purchaseAmount, setPurchaseAmount] = useState(
    asset.purchaseAmount != null ? String(asset.purchaseAmount) : '',
  )
  const [description, setDescription] = useState(asset.description ?? '')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const amountRaw = purchaseAmount.trim()
    const amount = amountRaw === '' ? undefined : Number(amountRaw)
    if (amountRaw !== '' && !Number.isFinite(amount)) return

    const nextDate = purchaseDate || undefined
    const nextDescription = description.trim() || undefined

    await db.assets.where('id').equals(asset.id).modify((row) => {
      if (nextDate) row.purchaseDate = nextDate
      else delete row.purchaseDate
      if (amount != null) row.purchaseAmount = amount
      else delete row.purchaseAmount
      if (nextDescription) row.description = nextDescription
      else delete row.description
    })
    onClose()
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-labelledby="edit-asset-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-asset-details-title">Edit details</h2>
        <p>Purchase info, warranty, and maintenance notes.</p>
        <form onSubmit={(e) => void submit(e)}>
          <div className="field">
            <label htmlFor="purchase-date">Purchase date</label>
            <input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="purchase-amount">Purchase amount</label>
            <input
              id="purchase-amount"
              type="number"
              min={0}
              step="0.01"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="field">
            <label htmlFor="asset-description">Description</label>
            <textarea
              id="asset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Warranty info, maintenance instructions, serial numbers…"
              rows={4}
            />
          </div>
          <div className="btn-row">
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
