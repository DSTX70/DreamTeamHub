Confidential and proprietary and copyright Dustin Sparks 2025

# Medical Case Canon (Zero-Loss)
This folder is the durable, versionable home for medical history carried over from chats, labs, imaging, and notes.

## Folder structure
- `records/`  Source summaries and pointers (labs, imaging, notes)
- `timeline/` Timeline entries (chronological)
- `briefs/`   Clinician-ready outputs (exec brief, memos, question lists)

## How to ingest history from prior threads
1) For each lab/imaging/note/log, create a file in `records/` using the template.
2) Add a timeline entry in `timeline/`.
3) When enough records exist, generate/update:
   - `briefs/ExecutiveBrief.md`
   - `briefs/Questions.md`
   - `briefs/ANS_Memo_Rowen.md`
   - `briefs/Sleep_Memo_Somnus.md`

## Safety boundary
This system is educational support only. It organizes evidence and questions for licensed clinicians.
