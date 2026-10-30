# SML homepage redesign — QA checklist

This branch is an isolated preview only. Do not merge or publish to production before completing these checks.

## Visual and responsive
- [ ] Open `/redesign-preview.html` on desktop and iPhone Safari.
- [ ] Confirm no horizontal overflow, clipped headings, overlapping CTAs, or unreadable small text.
- [ ] Confirm hero, service cards, pricing, coach credentials, FAQ, and footer all render.
- [ ] Replace generic stock imagery with approved Striking Motion Lab photography before production.

## Conversion
- [ ] Test every WhatsApp CTA and verify it opens the intended SML number with a useful prefilled message.
- [ ] Check 1:1, couples, small-group and B2B pathways.
- [ ] Ensure pricing and inclusions match the current offer.

## Technical and trust
- [ ] Verify legal links against the actual published routes.
- [ ] Confirm mobile sticky CTA does not cover content or browser controls.
- [ ] Check image loading, layout shift, console errors, keyboard focus, and reduced-motion behavior.
- [ ] Confirm this preview does not alter the homepage entry point, MI SML, Academy, or production deploy.

## Release gate
Do not merge until the preview has been opened and the checklist above is completed. A successful build alone is not visual QA.