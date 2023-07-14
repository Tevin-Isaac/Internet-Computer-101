import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, Principal } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Note = Record<{
  owner: Principal;
  id: string;
  title: string;
  content: string;
  created_at: nat64;
  updated_at: Opt<nat64>;
  tags: string[];
  archived?: boolean;
  favorite?: boolean;
}>;

type NotePayload = Record<{
  title: string;
  content: string;
}>;

const notesStorage = new StableBTreeMap<string, Note>(0, 44, 512);

// Fetches all notes of the caller
$query
export function getNotes(): Result<Vec<Note>, string> {
  return Result.Ok(
    notesStorage.values().filter((note) => note.owner.toString() === ic.caller.toString())
  );
}

// Fetches a specific note
$query
export function getNote(id: string): Result<Note, string> {
  const note = notesStorage.get(id);

  if (!note) {
    return Result.Err<Note, string>(`A note with id=${id} not found`);
  }

  if (note.owner.toString() !== ic.caller().toString()) {
    return Result.Err<Note, string>('Not owner of note');
  }

  return Result.Ok<Note, string>(note);
}

// Fetches all notes of the caller by their tag
$query
export function getNotesByTag(tag: string): Result<Vec<Note>, string> {
  return Result.Ok(
    notesStorage.values().filter((note) => note.owner.toString() === ic.caller.toString() && note.tags.includes(tag))
  );
}

// Allows users to add tags to their notes
$update
export function addTagsToNote(id: string, tags: string[]): Result<Note, string> {
  const note = notesStorage.get(id);

  if (!note) {
    return Result.Err<Note, string>(`Couldn't add tags to note with id=${id}. Note not found`);
  }

  if (note.owner.toString() !== ic.caller().toString()) {
    return Result.Err<Note, string>('You are not the owner of this note');
  }

  const updatedNote: Note = { ...note, tags: [...note.tags, ...tags] };
  notesStorage.insert(note.id, updatedNote);
  return Result.Ok<Note, string>(updatedNote);
}

// Allows users to create and add a note
$update
export function addNote(payload: NotePayload): Result<Note, string> {
  const err = checkPayload(payload);
  if (err) {
    return Result.Err<Note, string>(err);
  }

  const note: Note = {
    owner: ic.caller(),
    id: uuidv4(),
    created_at: ic.time(),
    updated_at: Opt.None,
    tags: [],
    ...payload,
  };

  notesStorage.insert(note.id, note);
  return Result.Ok(note);
}

// Allows users to update the content and/or title of their notes
$update
export function updateNote(id: string, payload: NotePayload): Result<Note, string> {
  const err = checkPayload(payload);
  if (err) {
    return Result.Err<Note, string>(err);
  }

  const note = notesStorage.get(id);

  if (!note) {
    return Result.Err<Note, string>(`Couldn't update a note with id=${id}. Note not found`);
  }

  if (note.owner.toString() !== ic.caller().toString()) {
    return Result.Err<Note, string>('You are not the owner of this note');
  }

  const updatedNote: Note = { ...note, ...payload, updated_at: Opt.Some(ic.time()) };
  notesStorage.insert(note.id, updatedNote);
  return Result.Ok(updatedNote);
}

// Allows users to delete their notes
$update
export function deleteNote(id: string): Result<Note, string> {
  const note = notesStorage.get(id);

  if (!note) {
    return Result.Err<Note, string>(`Couldn't delete a note with id=${id}. Note not found.`);
  }

  if (note.owner.toString() !== ic.caller().toString()) {
    return Result.Err<Note, string>('You are not the owner of this note');
  }

  notesStorage.remove(id);
  return Result.Ok(note);
}

// Allows users to search for notes by title or content
$query
export function searchNotes(query: string): Result<Vec<Note>, string> {
  const lowerCaseQuery = query.toLowerCase();
  const filteredNotes = notesStorage.values().filter(
    (note) =>
      note.owner.toString() === ic.caller().toString() &&
      (note.title.toLowerCase().includes(lowerCaseQuery) ||
        note.content.toLowerCase().includes(lowerCaseQuery))
  );
  return Result.Ok(filteredNotes);
}

// Input Validation: Check if the payload title and content are empty
function checkPayload(payload: NotePayload): string {
  if (!payload.title.trim()) {
    return 'Empty title';
  }
  if (!payload.content.trim()) {
    return 'Empty content';
  }
  return '';
}

// Authentication and Authorization: Add authentication and authorization checks
function isAuthenticatedCaller(): boolean {
  // Implement your authentication logic here
  return true; // Replace with the actual authentication check
}

function isAuthorizedOwner(note: Note): boolean {
  // Implement your authorization logic here
  return note.owner.toString() === ic.caller().toString(); // Replace with the actual authorization check
}

function validateCaller(): void {
  if (!isAuthenticatedCaller()) {
    throw new Error('Unauthorized access');
  }
}

// Wrap all functions requiring authentication and authorization checks
function authenticatedAndAuthorized<T>(fn: () => T): T {
  validateCaller();
  return fn();
}
