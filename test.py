turnWhite = True
# Some variable to mark the end of the game(?)
gameCont = True
# Variable to keep track of which player's turn (Number)
val = 0
# Nested Loop to create board
board = []
for i in range(10):
    board.append([])
    for j in range(10):
        if i == 0 and j != 0:
            board[i].append(chr(64 + j))
        elif i == 0 and j == 0:
            board[i].append(" ")
        elif j == 0:
            board[i].append(i)
        else:
            board[i].append(".")


# Function to have to board print out
def boardPrint():
    for i in board:
        for j in i:
            print(j, end=" ")
        print()


# Loop to keep game going until user chooses to stop
while gameCont:
    # Print whose turn it is
    print(f"Player {val%2+1}'s turn:")
    val += 1
    boardPrint()
    # Check if user wants to stop
    if (
        input('Would you like to stop? Type "stop" to stop, anything otherwise...')
        == "stop"
    ):
        break
    print()
    letter = input("What letter would you like to place your move on? ")
    i = int(ord(letter)) - 64
    num = int(input("What num would you like to place your move on? "))
    print()
    # Check if the given value is in range of the list (Square matrix)
    while num >= len(board) or i >= len(board):
        print(
            "Congratulations, your illiteracy has become all but too apparent. Please input a valid coordinate, heathen."
        )
        letter = input("What letter would you like to place your move on? ")
        print()
        i = int(ord(letter)) - 64
        num = int(input("What num would you like to place your move on? "))
        print()
    # Check if there is an item on the given space
    while board[num][i] != ".":
        print("There is already an item. Choose again")
        letter = input("What letter would you like to place your move on? ")
        print()
        i = int(ord(letter)) - 64
        num = int(input("What num would you like to place your move on? "))
        print()
    # Make value that switches turns after every go
    if turnWhite:
        board[num][i] = chr(9675)
    else:
        board[num][i] = chr(9679)
    # Change turn variable
    turnWhite = not turnWhite
