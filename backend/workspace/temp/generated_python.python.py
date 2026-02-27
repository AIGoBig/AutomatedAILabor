# fibonacci.py

def generate_fibonacci(n):
    """
    Generates the first n numbers of the Fibonacci sequence.
    
    The sequence starts with 0 and 1. Each subsequent number is the sum 
    of the previous two.
    
    Args:
        n (int): The number of Fibonacci numbers to generate.
        
    Returns:
        list: A list containing the first n Fibonacci numbers.
    """
    # Handle edge cases for non-positive input
    if n <= 0:
        return []
    # Handle the case for the first number only
    elif n == 1:
        return [0]
    
    # Initialize the sequence with the first two numbers
    fib_sequence = [0, 1]
    
    # Iteratively calculate the next numbers until the list reaches length n
    while len(fib_sequence) < n:
        next_val = fib_sequence[-1] + fib_sequence[-2]
        fib_sequence.append(next_val)
    
    return fib_sequence

def main():
    """
    Main entry point to execute the Fibonacci generation and printing.
    """
    # Requirement: Default to printing the first 10 numbers
    n_terms = 10
    
    print(f"--- Fibonacci Sequence Generator ---")
    print(f"Generating the first {n_terms} numbers:")
    
    try:
        sequence = generate_fibonacci(n_terms)
        
        # Format the output as a comma-separated string for readability
        formatted_output = ", ".join(map(str, sequence))
        print(formatted_output)
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()