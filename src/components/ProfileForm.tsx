'use client'

import { useState } from 'react'
import { ActionForm } from './ActionForm'
import { SubmitButton } from './SubmitButton'
import { saveProfile } from '@/app/profile-actions'
import { CLASS_YEARS, INTERESTS, MENTOR_ELIGIBLE, MENTOR_STATUS, type ClassYear } from '@/lib/constants'
import type { Profile } from '@/lib/types'

export function ProfileForm({ profile, submitLabel }: { profile: Profile; submitLabel: string }) {
  const [year, setYear] = useState<ClassYear | ''>(profile.class_year ?? '')
  const canMentor = year !== '' && MENTOR_ELIGIBLE.includes(year)

  return (
    <ActionForm action={saveProfile} className="space-y-5" successMessage="Profile saved.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">Name</label>
          <input id="full_name" name="full_name" className="input" defaultValue={profile.full_name} required />
        </div>
        <div>
          <label className="label" htmlFor="class_year">Year</label>
          <select
            id="class_year"
            name="class_year"
            className="input"
            value={year}
            onChange={(e) => setYear(e.target.value as ClassYear)}
            required
          >
            <option value="" disabled>Choose…</option>
            {Object.entries(CLASS_YEARS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="major">Major / program</label>
          <input id="major" name="major" className="input" defaultValue={profile.major} placeholder="e.g. BBA, BBA + CS minor" />
        </div>
      </div>

      <fieldset>
        <legend className="label">Career interests</legend>
        <p className="mb-2 text-xs text-gray-500">These drive your mentor matches. Pick up to 8.</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <label key={interest} className="cursor-pointer">
              <input
                type="checkbox"
                name="interests"
                value={interest}
                defaultChecked={profile.interests.includes(interest)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm capitalize text-gray-700 transition peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-navy/30">
                {interest}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="goals">Goals</label>
        <textarea
          id="goals"
          name="goals"
          rows={2}
          className="input"
          defaultValue={profile.goals}
          placeholder="e.g. Land a summer consulting internship, figure out which clubs to join"
        />
      </div>
      <div>
        <label className="label" htmlFor="bio">Short bio</label>
        <textarea id="bio" name="bio" rows={3} className="input" defaultValue={profile.bio} placeholder="Hometown, clubs, past internships, fun facts…" />
      </div>
      <div>
        <label className="label" htmlFor="linkedin_url">LinkedIn (optional)</label>
        <input id="linkedin_url" name="linkedin_url" type="url" className="input" defaultValue={profile.linkedin_url ?? ''} placeholder="https://linkedin.com/in/…" />
      </div>

      <fieldset>
        <legend className="label">Mentorship</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(MENTOR_STATUS).map(([value, label]) => {
            const disabled = value !== 'mentee' && !canMentor
            return (
              <label key={value} className={disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}>
                <input
                  type="radio"
                  name="mentor_status"
                  value={value}
                  defaultChecked={profile.mentor_status === value}
                  disabled={disabled}
                  className="peer sr-only"
                />
                <span className="block h-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-700 transition peer-checked:border-navy peer-checked:ring-2 peer-checked:ring-navy/20">
                  {label}
                </span>
              </label>
            )
          })}
        </div>
        {!canMentor && <p className="mt-2 text-xs text-gray-500">Mentoring opens up once you&apos;re a junior.</p>}
      </fieldset>

      <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
    </ActionForm>
  )
}
