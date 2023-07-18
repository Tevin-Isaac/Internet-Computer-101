import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, Principal } from 'azle';
import { v4 as uuidv4 } from 'uuid';


type Note = Record<{
    owner: Principal;
    id: string;
    title: string;
    content: string;
    created_at: nat64;
    updated_at: Opt<nat64>;
    tags: Vec<string>;
    archived:  Opt<boolean>;
    favorite: Opt<boolean>;
}>;

type NotePayload = Record<{
    title: string;
    content: string;
}>;

const notesStorage = new StableBTreeMap<string, Note>(0, 44, 512);

// Fetches all notes of the caller with pagination
$query
export function getNotes(offset: number, limit: number): Result<Vec<Note>, string> {
    const callerNotes = notesStorage
        .values()
        .filter((note) => note.owner.toString() === ic.caller.toString());
    const paginatedNotes = callerNotes.slice(offset, offset + limit);
    return Result.Ok(paginatedNotes);
}

// Fetches a specific note
$query
export function getNote(id: string): Result<Note, string> {
    return match(notesStorage.get(id), {
        Some: (note) => {
            if (note.owner.toString() !== ic.caller().toString()) {
                return Result.Err<Note, string>('Not owner of note');
            }
            return Result.Ok<Note, string>(note);
        },
        None: () => Result.Err<Note, string>(`A note with id=${id} not found`),
    });
}

// Fetches all notes of the caller by their tag
$query
export function getNotesByTag(tag: string): Result<Vec<Note>, string> {
    const callerNotes = notesStorage
        .values()
        .filter((note) => note.owner.toString() === ic.caller.toString() && note.tags.includes(tag));
    return Result.Ok(callerNotes);
}

// Allows users to add tags to their notes
$update
export function addTagsToNote(
    id: string,
    tags: Vec<string>
): Result<Note, string> {
    return match(notesStorage.get(id), {
        Some: (note) => {
            if (note.owner.toString() !== ic.caller().toString()) {
                return Result.Err<Note, string>('You are not the owner of this note');
            }
            const updatedNote: Note = { ...note, tags: [...note.tags, ...tags] };
            notesStorage.insert(note.id, updatedNote);
            return Result.Ok<Note, string>(updatedNote);
        },
        None: () =>
            Result.Err<Note, string>(`Couldn't add tags to note with id=${id}. Note not found`),
    });
}

// Allows users to create and add a note
$update
export function addNote(payload: NotePayload): Result<Note, string> {
    try {
        const note: Note = {
            owner: ic.caller(),
            id: uuidv4(),
            created_at: ic.time(),
            updated_at: Opt.None,
            tags:[],
            archived: Opt.Some(false),
             favorite: Opt.Some(false),
            ...payload,
        };
        notesStorage.insert(note.id, note);
        return Result.Ok<Note,string>(note);
    } catch (error) {
        return Result.Err<Note,string>("Problem with adding the Note");
    }
    
}

// Allows users to update the content and/or title of their notes
$update
export function updateNote(
    id: string,
    payload: NotePayload
): Result<Note, string> {
    const err = checkPayload(payload);
    if (err.length > 0) {
        return Result.Err<Note, string>(err);
    }
    return match(notesStorage.get(id), {
        Some: (note) => {
            if (note.owner.toString() !== ic.caller().toString()) {
                return Result.Err<Note, string>('You are not the owner of this note');
            }
            const updatedNote: Note = { ...note, ...payload, updated_at: Opt.Some(ic.time()) };
            notesStorage.insert(note.id, updatedNote);
            return Result.Ok<Note, string>(updatedNote);
        },
        None: () => Result.Err<Note, string>(`Couldn't update a note with id=${id}. Note not found`),
    });
}

// Allows users to delete their notes
$update
export function deleteNote(id: string): Result<Note, string> {
    return match(notesStorage.get(id), {
        Some: (deletedNote) => {
            if (deletedNote.owner.toString() !== ic.caller().toString()) {
                return Result.Err<Note, string>('You are not the owner of this note');
            }
            notesStorage.remove(id);
            return Result.Ok<Note, string>(deletedNote);
        },
        None: () =>
            Result.Err<Note, string>(`Couldn't delete a note with id=${id}. Note not found.`),
    });
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

// Allows users to archive a note
$update
export function archiveNote(id: string): Result<Note, string> {
    return match(notesStorage.get(id), {
        Some: (note) => {
            if (note.owner.toString() !== ic.caller().toString()) {
                return Result.Err<Note, string>('You are not the owner of this note');
            }
            const archivedNote: Note = { ...note, archived: Opt.Some(true) };
            notesStorage.insert(note.id, archivedNote);
            return Result.Ok<Note, string>(archivedNote);
        },
        None: () => Result.Err<Note, string>(`Couldn't archive note with id=${id}. Note not found`),
    });
}

// Allows users to unarchive a note
$update
export function unarchiveNote(id: string): Result<Note, string> {
    return match(notesStorage.get(id), {
        Some: (note) => {
            if (note.owner.toString() !== ic.caller().toString()) {
                return Result.Err<Note, string>('You are not the owner of this note');
            }
            const unarchivedNote: Note = { ...note, archived: Opt.Some(false) };
            notesStorage.insert(note.id, unarchivedNote);
            return Result.Ok<Note, string>(unarchivedNote);
        },
        None: () =>
            Result.Err<Note, string>(`Couldn't unarchive note with id=${id}. Note not found`),
    });
}

// Allows users to favorite a note
$update
export function favoriteNote(id: string): Result<Note, string> {
    return match(notesStorage.get(id), {
        Some: (note) => {
            if (note.owner.toString() !== ic.caller().toString()) {
                return Result.Err<Note, string>('You are not the owner of this note');
            }
            const favoriteNote: Note = { ...note, favorite: Opt.Some(true) };
            notesStorage.insert(note.id, favoriteNote);
            return Result.Ok<Note, string>(favoriteNote);
        },
        None: () =>
            Result.Err<Note, string>(`Couldn't favorite note with id=${id}. Note not found`),
    });
}

// Allows users to unfavorite a note
$update
export function unfavoriteNote(id: string): Result<Note, string> {
    return match(notesStorage.get(id), {
        Some: (note) => {
            if (note.owner.toString() !== ic.caller().toString()) {
                return Result.Err<Note, string>('You are not the owner of this note');
            }
            const unfavoriteNote: Note = { ...note, favorite: Opt.Some(true) };
            notesStorage.insert(note.id, unfavoriteNote);
            return Result.Ok<Note, string>(unfavoriteNote);
        },
        None: () =>
            Result.Err<Note, string>(`Couldn't unfavorite note with id=${id}. Note not found`),
    });
}

function checkPayload(payload: NotePayload): string {
    if (payload.title.length === 0) {
        return 'Empty title';
    }
    if (payload.content.length === 0) {
        return 'Empty content';
    }
    return '';
}

// UUID workaround
globalThis.crypto = {
    //@ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },
};
