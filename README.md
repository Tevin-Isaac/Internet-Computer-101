# Note-Taking Application
This is a  note-taking application.The application allows users to create, read, update, and delete notes, as well as perform additional operations such as tagging, archiving, and marking notes as favorites.


# Features
The note-taking application provides the following features:

* Create Note: Users can create a new note by providing a title and content. A unique identifier is automatically assigned to each note.

* Update Note: Users can update the title and content of their existing notes.

* Delete Note: Users can delete their notes, permanently removing them from the storage.

* Tagging: Users can add tags to their notes, allowing for easier organization and categorization.

* Search: Users can search for notes based on the title or content. The search is case-insensitive and returns notes that match the search query.

* Archiving: Users can archive notes, effectively marking them as inactive or hidden. Archived notes can be unarchived to make them active again.

* Favorites: Users can mark notes as favorites, making them easily accessible for quick reference.


# Usage

* getNotes(): Fetches all notes owned by the caller.

* getNote(id): Fetches a specific note by its ID, ensuring that the caller is the owner of the note.

* getNotesByTag(tag): Fetches all notes owned by the caller that have a specific tag.

* addTagsToNote(id, tags): Adds tags to a specific note owned by the caller.

* addNote(payload): Creates a new note with the provided title and content.

* updateNote(id, payload): Updates the content and/or title of a specific note owned by the caller.

* deleteNote(id): Deletes a specific note owned by the caller.

* searchNotes(query): Searches for notes that match the given query string in their title or content.

* archiveNote(id): Archives a specific note owned by the caller.

* unarchiveNote(id): Unarchives a specific note owned by the caller.

* FavoriteNote(id): Marks a specific note as a favorite for the caller.

* unfavoriteNote(id): Removes the favorite status from a specific note for the caller.


# RUN LOCALLY

1. Run `npm install`.
2. Make sure you have DFX installed, if not install from here [installation](https://demergent-labs.github.io/azle/installation.html).
3. Run `dfx start --background` to get dfx started.
4. Run `dfx deploy` to deploy the code(First time takes several minutes so have patience).
5. Now you can interact using the dfx cli or the web interface(link will be visible after deployment).
