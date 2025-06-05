-- CreateTable
CREATE TABLE [Contact] (
    [id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    [phoneNumber] NVARCHAR(MAX),
    [email] NVARCHAR(MAX),
    [linkedId] INT,
    [linkPrecedence] NVARCHAR(255) NOT NULL DEFAULT 'primary',
    [createdAt] DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME NOT NULL,
    [deletedAt] DATETIME,
    CONSTRAINT [Contact_linkedId_fkey] FOREIGN KEY ([linkedId]) REFERENCES [Contact] ([id]) ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX [Contact_email_idx] ON [Contact]([email]);

-- CreateIndex
CREATE INDEX [Contact_phoneNumber_idx] ON [Contact]([phoneNumber]);

-- CreateIndex
CREATE INDEX [Contact_linkedId_idx] ON [Contact]([linkedId]);
