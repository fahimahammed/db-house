# Database Transactions: ACID Properties & Normalization

---

## 1. What is ACID in a Database?

In a Relational Database Management System (RDBMS), a **Transaction** is a logical unit of work that contains one or more database operations (such as `SELECT`, `INSERT`, `UPDATE`, `DELETE`). 

**ACID** is an acronym representing the four fundamental properties that guarantee database transactions are processed reliably, even in the event of hardware failures, network crashes, or concurrent access:

- **A** – **Atomicity** (*All or Nothing*)
- **C** – **Consistency** (*Preserving Invariants & Rules*)
- **I** – **Isolation** (*Concurrent Independence*)
- **D** – **Durability** (*Persistence After Commit*)

---

## 2. Atomicity ("All or Nothing")

### Concept
Atomicity guarantees that all operations within a transaction complete successfully, or none of them are applied. If any statement fails midway, the database rolls back to its state prior to the transaction.

### Example: Bank Fund Transfer
Suppose Alice transfers **\$100** to Bob:
1. Debit \$100 from Alice's account.
2. Credit \$100 to Bob's account.

```sql
BEGIN TRANSACTION;

-- Step 1: Deduct from Alice
UPDATE accounts 
SET balance = balance - 100 
WHERE account_id = 'Alice';

-- What if the server crashes or power fails right here?
-- Without Atomicity: Alice loses $100, Bob never gets it.

-- Step 2: Add to Bob
UPDATE accounts 
SET balance = balance + 100 
WHERE account_id = 'Bob';

COMMIT;
```

**With Atomicity:** If a crash or error occurs before `COMMIT`, the database engine invokes an automatic `ROLLBACK`. Alice's balance remains unchanged, preventing money from vanishing into thin air.

---

## 3. Consistency

### Concept
Consistency ensures that a transaction can only transition the database from one valid state to another, strictly satisfying all defined database rules:
- **Constraints**: `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `CHECK`, `UNIQUE`.
- **Triggers & Cascades**: Automated integrity rules.
- **Application Invariants**: Business rules (e.g., total funds in the bank system must balance).

### Example: Negative Balance Constraint
Suppose there is a check constraint ensuring account balances cannot be negative:

```sql
ALTER TABLE accounts ADD CONSTRAINT chk_positive_balance CHECK (balance >= 0);
```

If Alice only has \$50 and tries to transfer \$100:

```sql
BEGIN TRANSACTION;

UPDATE accounts 
SET balance = balance - 100 
WHERE account_id = 'Alice'; -- balance would become -50!

-- The DB rejects this statement because it violates chk_positive_balance.
-- The transaction is aborted and rolled back.
ROLLBACK;
```

The database ensures that no invalid data is ever written to disk.

---

## 4. Isolation

### Concept
Isolation dictates how concurrent transactions interact and observe changes made by one another. Even if multiple transactions run concurrently on the same tables, Isolation ensures the intermediate states of an uncommitted transaction remain hidden from others.

### Concurrency Read Anomalies
To understand isolation levels, we first look at the concurrency problems they prevent:

| Anomaly | Description |
| :--- | :--- |
| **Dirty Read** | Transaction $T_2$ reads uncommitted changes written by $T_1$. If $T_1$ rolls back, $T_2$ has worked with data that technically never existed. |
| **Non-Repeatable Read** (Fuzzy Read) | $T_1$ reads a row. $T_2$ modifies or deletes that row and commits. If $T_1$ re-reads that same row, it observes different values. |
| **Phantom Read** | $T_1$ reads a set of rows matching a range query (e.g., `WHERE age > 30`). $T_2$ inserts a new row matching the condition and commits. $T_1$ re-runs the query and sees new "phantom" rows. |
| **Serialization Anomaly / Write Skew** | Multiple transactions execute concurrently with overlapping reads and disjoint writes, leaving the database in a state that could not have occurred if they ran one after another. |

---

## 5. Standard SQL Isolation Levels

ANSI SQL defines four isolation levels offering different trade-offs between concurrency (performance) and data isolation (safety):

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
| :--- | :---: | :---: | :---: |
| **Read Uncommitted** | Allowed | Allowed | Allowed |
| **Read Committed** (Default in PostgreSQL/Oracle) | Prevented | Allowed | Allowed |
| **Repeatable Read** (Default in MySQL InnoDB) | Prevented | Prevented | Allowed (Standard)* |
| **Serializable** | Prevented | Prevented | Prevented |

*\*Note: In modern engines like MySQL (InnoDB) and PostgreSQL, Repeatable Read also prevents Phantom Reads through Next-Key Locking or MVCC snapshots.*

---

## 6. Deep Dive: Repeatable Read

### Concept
Under **Repeatable Read**, once transaction $T_1$ reads a row, any subsequent read of that row within the same transaction is guaranteed to return the exact same values, regardless of whether other transactions updated and committed that row in the meantime.

### Step-by-Step Example: Read Committed vs. Repeatable Read

Imagine an inventory check:

```sql
-- Initial State
-- product_id = 1, stock = 10
```

#### Under Read Committed:
1. **$T_1$**: `SELECT stock FROM products WHERE product_id = 1;` $\rightarrow$ returns **10**.
2. **$T_2$**: `UPDATE products SET stock = 7 WHERE product_id = 1; COMMIT;`
3. **$T_1$**: `SELECT stock FROM products WHERE product_id = 1;` $\rightarrow$ returns **7** *(Non-repeatable read!)*

#### Under Repeatable Read:
1. **$T_1$ (Repeatable Read)**: `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;`
2. **$T_1$**: `SELECT stock FROM products WHERE product_id = 1;` $\rightarrow$ returns **10**.
3. **$T_2$**: `UPDATE products SET stock = 7 WHERE product_id = 1; COMMIT;`
4. **$T_1$**: `SELECT stock FROM products WHERE product_id = 1;` $\rightarrow$ **still returns 10**!

### How Databases Implement Repeatable Read:
- **MVCC (Multi-Version Concurrency Control)**: PostgreSQL and MySQL InnoDB take a snapshot of the database at the start of the transaction (or at the first read). Reads are served from this consistent point-in-time snapshot without blocking writes.
- **Shared Read Locks (Pessimistic)**: Traditional lock-based engines hold shared read locks until the end of the transaction, blocking concurrent transactions from modifying those rows.

---

## 7. Isolation Rules & Durability

### Isolation Implementation Rules
Under the hood, database engines enforce isolation using:
1. **Two-Phase Locking (2PL)**:
   - **Growing Phase**: Locks are acquired, none released.
   - **Shrinking Phase**: Locks are released, none acquired.
   - **Strict 2PL**: Exclusive write locks are held until transaction `COMMIT` or `ROLLBACK` to prevent cascading aborts.
2. **MVCC (Multi-Version Concurrency Control)**:
   - Keeps multiple versions of a row (`xmin`/`xmax` in Postgres, Undo Logs in MySQL InnoDB).
   - Readers never block writers; writers never block readers.

---

### Durability ("Permanent Once Committed")

#### Concept
Once a transaction is committed, its changes survive permanently—even across system crashes, hardware failures, or abrupt power loss.

#### How Durability Works Under the Hood:
1. **Write-Ahead Logging (WAL)** / **Redo Log**:
   - Writing modified table blocks to disk is slow and random.
   - Instead, the database first writes the sequence of changes sequentially to an append-only transaction log on disk (WAL) and forces a flush (`fsync`).
   - Only after the WAL is written to persistent storage is the `COMMIT` acknowledged to the client.
2. **Crash Recovery (ARIES algorithm)**:
   - If the system crashes before dirty memory pages are written to data files, the database boots up and inspects the WAL.
   - It **re-does** committed transactions that were not yet flushed to data pages.
   - It **un-does** uncommitted transactions that had partial writes in data pages.

---

## 8. Database Normalization

### Concept
**Normalization** is the systematic process of designing relational database schemas to:
1. Eliminate data redundancy (storing the same data in multiple places).
2. Avoid data anomalies:
   - **Insertion Anomaly**: Cannot record an entity without creating an unrelated entity.
   - **Update Anomaly**: Modifying a value requires updating multiple rows; missing one causes inconsistency.
   - **Deletion Anomaly**: Deleting one piece of information unintentionally wipes out unrelated data.

---

### Example Scenario: Unnormalized Data (UNF)

Consider an unnormalized course enrollment table:

| StudentID | StudentName | CourseCode | CourseName | Instructor | InstructorRoom |
| :--- | :--- | :--- | :--- | :--- | :--- |
| S101 | Alice | CS101, CS102 | Intro CS, Data Struct | Dr. Smith, Dr. Brown | R10, R15 |
| S102 | Bob | CS101 | Intro CS | Dr. Smith | R10 |

Anomalies present:
- Multivalued attributes in single cells.
- If Dr. Smith moves offices, we must update multiple rows.
- If we delete Bob, we might lose records if he were the only student in a course.

---

### 1NF (First Normal Form)

**Rule:**
- Each column must contain atomic (indivisible) values.
- Each record must be unique (a Primary Key must exist).
- No repeating groups or arrays.

**After 1NF Transformation:**
Primary Key: `(StudentID, CourseCode)`

| StudentID | StudentName | CourseCode | CourseName | Instructor | InstructorRoom |
| :--- | :--- | :--- | :--- | :--- | :--- |
| S101 | Alice | CS101 | Intro CS | Dr. Smith | R10 |
| S101 | Alice | CS102 | Data Struct | Dr. Brown | R15 |
| S102 | Bob | CS101 | Intro CS | Dr. Smith | R10 |

---

### 2NF (Second Normal Form)

**Rule:**
- Must be in **1NF**.
- Must eliminate **Partial Functional Dependencies**: All non-key attributes must depend on the **entire** composite primary key, not just a subset of it.

In our 1NF table:
- Primary Key is `(StudentID, CourseCode)`.
- `StudentName` depends only on `StudentID` (*Partial Dependency*).
- `CourseName`, `Instructor`, `InstructorRoom` depend only on `CourseCode` (*Partial Dependency*).

**After 2NF Decomposition:**

#### Table 1: `Students` (PK: StudentID)
| StudentID | StudentName |
| :--- | :--- |
| S101 | Alice |
| S102 | Bob |

#### Table 2: `Courses` (PK: CourseCode)
| CourseCode | CourseName | Instructor | InstructorRoom |
| :--- | :--- | :--- | :--- |
| CS101 | Intro CS | Dr. Smith | R10 |
| CS102 | Data Struct | Dr. Brown | R15 |

#### Table 3: `Enrollments` (PK: StudentID, CourseCode)
| StudentID | CourseCode |
| :--- | :--- |
| S101 | CS101 |
| S101 | CS102 |
| S102 | CS101 |

---

### 3NF (Third Normal Form)

**Rule:**
- Must be in **2NF**.
- Must eliminate **Transitive Dependencies**: Non-key attributes must not depend on other non-key attributes ($X \to Y \to Z$). Every non-key column must depend *only* on the primary key ("the key, the whole key, and nothing but the key").

In `Courses`:
- `CourseCode` $\rightarrow$ `Instructor`
- `Instructor` $\rightarrow$ `InstructorRoom`
- `InstructorRoom` transitively depends on `CourseCode` via `Instructor`.

**After 3NF Decomposition:**

#### Table 1: `Instructors` (PK: InstructorID)
| InstructorID | InstructorName | InstructorRoom |
| :--- | :--- | :--- |
| I1 | Dr. Smith | R10 |
| I2 | Dr. Brown | R15 |

#### Table 2: `Courses` (PK: CourseCode, FK: InstructorID)
| CourseCode | CourseName | InstructorID |
| :--- | :--- | :--- |
| CS101 | Intro CS | I1 |
| CS102 | Data Struct | I2 |

Now, if Dr. Smith changes rooms, we only modify a single row in the `Instructors` table.

---

### BCNF (Boyce-Codd Normal Form)

**Rule:**
- A stricter version of 3NF.
- For every functional dependency $X \rightarrow Y$, $X$ must be a **superkey** (candidate key).

**When is 3NF not enough?**
When a table has multiple overlapping candidate keys.

#### Example Scenario:
Imagine an advising table where:
- A student can have multiple advisors for different subjects: `(StudentID, Subject)`.
- Each advisor advises only one subject: `Advisor` $\rightarrow$ `Subject`.
- Candidates Keys: `(StudentID, Subject)` and `(StudentID, Advisor)`.

In 3NF, `Advisor` $\rightarrow$ `Subject` is permitted because `Subject` is a prime attribute (part of candidate key `(StudentID, Subject)`). However, `Advisor` is not a superkey on its own!

**Decomposition to BCNF:**
1. `Advisor_Subject(Advisor, Subject)` — where `Advisor` is the Primary Key.
2. `Student_Advisor(StudentID, Advisor)` — where `(StudentID, Advisor)` is the Primary Key.

---

## 9. Summary & Quick Reference

```
ACID Properties:
├── Atomicity   -> All or nothing (Rollback on failure)
├── Consistency -> Adheres to schema rules & constraints (Invariants preserved)
├── Isolation   -> Concurrency control (Prevent dirty/fuzzy/phantom reads)
└── Durability  -> Committed transactions survive crashes (WAL / Redo log)

Isolation Levels (Least Strict -> Most Strict):
Read Uncommitted < Read Committed < Repeatable Read < Serializable

Normalization Stages:
UNF -> 1NF (Atomic columns, unique rows)
    -> 2NF (No partial dependencies on composite PK)
    -> 3NF (No transitive dependencies between non-keys)
    -> BCNF (Every determinant is a superkey)
```

