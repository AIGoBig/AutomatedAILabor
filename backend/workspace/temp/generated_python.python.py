# /home/user/fibonacci.py

def get_fibonacci(n):
    """
    Generates the first n numbers of the Fibonacci sequence.
    
    Args:
        n (int): The number of Fibonacci numbers to generate.
        
    Returns:
        list: A list containing the first n Fibonacci numbers.
    """
    if n <= 0:
        return []
    
    fib_sequence = []
    a, b = 0, 1
    for _ in range(n):
        fib_sequence.append(a)
        a, b = b, a + b
    return fib_sequence

def main():
    # Number of Fibonacci numbers to calculate
    count = 20
    
    # Calculate the sequence
    result = get_fibonacci(count)
    
    # Print the result
    print(f"The first {count} Fibonacci numbers are:")
    # Printing as a comma-separated string for better readability
    print(", ".join(map(str, result)))

if __name__ == "__main__":
    main()