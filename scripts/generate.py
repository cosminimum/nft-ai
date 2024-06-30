import json
import openai
import logging
import requests
import configparser
from pathlib import Path
from openai import OpenAI
import sys

global openai_api_key, openai_organization_id, openai_model_name_prompt_generation
global openai_model_name_image_generation, openai_image_resolution, openai_image_quality, openai_number_of_images
global openai_temperature, openai_max_tokens, openai_top_p
global openai_frequency_penalty, openai_presence_penalty
global webhook_url


SYSTEM_PROMPT = ( "You are the best DALE-E 3 prompt crafter."
                  "Let's think in a step by step manner and carefully generate the best possible prompt based on the user's transactional data."
                  "It's CRUCIAL that your reply only contains the generated prompt, nothing else!"
                  "Here's some relevant tips and tricks about DALL-E 3 prompting:"

                  "- Be Specific and Detailed: The more specific your prompt, the better the image quality. Include details like the setting, objects, colors, mood, and any specific elements you want in the image."
                  "Example: Instead of asking for a “bird”, try something like “Picture a magnificent Scarlet Macaw in full flight against the backdrop of a vibrant tropical sunset. The sky is painted in hues of fiery orange, deep purples, and warm pinks as the sun dips below the horizon. The Scarlet Macaw’s brilliant scarlet plumage is illuminated by the golden rays of the setting sun, creating a striking contrast against the twilight sky. The bird’s outstretched wings showcase a vivid blend of red, yellow, and blue feathers, and its long tail feathers trail gracefully behind, adding to the overall spectacle. The macaw’s beak is open in mid-call, capturing a moment of its majestic flight in this tropical paradise..”"

                  "- Push the Boundaries of Imagination: DALL·E 3 is not limited to real-world imagery. It can generate images from abstract concepts, hypothetical scenarios, or even surreal ideas."
                  "Example: “Depict a surreal landscape where a river winds through a distorted, dreamlike terrain. The riverbanks should be lined with clocks of various shapes and sizes, each melting or morphing in a surreal manner.”"

                  "- Mood and Atmosphere: Describe the mood or atmosphere you want to convey. Words like “serene,” “chaotic,” “mystical,” or “futuristic” can guide the AI in setting the right tone."
                  "- Use Descriptive Adjectives: Adjectives help in refining the image. For example, instead of saying “a dog,” say “a fluffy, small, brown dog.”"
                  "- Consider Perspective and Composition: Mention if you want a close-up, a wide shot, a bird’s-eye view, or a specific angle. This helps in framing the scene correctly."
                  "- Specify Lighting and Time of Day: Lighting can dramatically change the mood of an image. Specify if it’s day or night, sunny or cloudy, or if there’s a specific light source like candlelight or neon lights."
                  "- Incorporate Action or Movement: If you want a dynamic image, describe actions or movements. For instance, “a cat jumping over a fence” is more dynamic than just “a cat.”"
                  "- Avoid Overloading the Prompt: While details are good, too many can confuse the AI. Try to strike a balance between being descriptive and being concise."
                  "- Use Analogies or Comparisons: Sometimes it helps to compare what you want with something well-known, like “in the style of Van Gogh” or “resembling a scene from a fantasy novel.”"
                  "- Specify Desired Styles or Themes: If you have a particular artistic style or theme in mind, mention it. For example, “cyberpunk,” “art deco,” or “minimalist.”"
                  "- Dare to Experiment: Don’t limit yourself to conventional or familiar prompts. Feel free to explore diverse domains and unconventional ideas with DALL·E 3. Whether it’s a scene from ancient mythology or a vision of future technology, let your imagination run wild!"
                  "Example: “A parallel universe where gravity pulls in different directions, creating surreal landscapes where people walk on walls and ceilings.”"
                  )


def parse_json_input(json_input):
    """
    Parse the input JSON string into a list of transactional records.

    Parameters:
    - json_input (str): A JSON string representing transactional data.

    Returns:
    list: A list of dictionaries, each containing transaction details.
    """

    try:
        transactions = json.loads(json_input)
        logging.info(f"JSON input parsed successfully!")
    except json.JSONDecodeError as e:
        logging.error(f"Error parsing JSON input: {e}")
        raise ValueError("Invalid JSON input") from e

    return transactions


def generate_prompt_from_transactions(transactions):
    """
    Create a description from a list of transaction dictionaries suitable for generating an abstract image.

    Parameters:
    - transactions (list of dict): A list of transaction dictionaries.

    Returns:
    str: A formatted string that describes the transactions for the image generation.
    """

    try:
        client = OpenAI(api_key=openai_api_key, organization=openai_organization_id)

        response = client.chat.completions.create(
            model=openai_model_name_prompt_generation,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": str(transactions)
                }
            ],
            temperature=openai_temperature,
            max_tokens=openai_max_tokens,
            top_p=openai_top_p,
            frequency_penalty=openai_frequency_penalty,
            presence_penalty=openai_presence_penalty
        )
        logging.info(f"Prompt generated successfully:\n {response.choices[0].message.content}")
        return response.choices[0].message.content
    except KeyError as e:
        logging.error(f"Missing transaction data key: {e}")
        raise ValueError(f"Transaction data missing required key: {e}") from e
    except openai.APIError as e:
        logging.error(f"OpenAI API error: {e}")
        raise RuntimeError("Failed to generate image with OpenAI API") from e
    except requests.exceptions.RequestException as e:
        logging.error(f"Network error when calling OpenAI API: {e}")
        raise RuntimeError("Network issue during image generation") from e


def generate_image(prompt):
    """
    Generate an image using the DALL-E model based on a provided textual prompt.

    Parameters:
    - prompt (str): A descriptive text prompt that specifies the desired characteristics and elements of the image to be generated.

    Returns:
    str: The URL of the generated image, hosted on OpenAI's servers.
    """

    client = OpenAI(api_key=openai_api_key, organization=openai_organization_id)

    try:
        response = client.images.generate(
            model=openai_model_name_image_generation,
            prompt=prompt,
            size=openai_image_resolution,
            quality=openai_image_quality,
            n=openai_number_of_images,
        )
        image_url = response.data[0].url
        logging.info(f"Image generated successfully!")

        return image_url
    except openai.APIError as e:
        logging.error(f"OpenAI API error: {e}")
        raise RuntimeError("Failed to generate image with OpenAI API") from e
    except requests.exceptions.RequestException as e:
        logging.error(f"Network error when calling OpenAI API: {e}")
        raise RuntimeError("Network issue during image generation") from e


def parse_JSON_and_generate_image(json_input):
    """
    Parse JSON input, create a prompt based on the input, and generate an image URL.

    Parameters:
    - json_input (str): A JSON string representing transactional data.
    - config_path (str): Path to the configuration file for OpenAI settings.

    Returns:
    str: URL of the generated image.

    """
    try:
        transactions = parse_json_input(json_input)
        prompt = generate_prompt_from_transactions(transactions)

        image_url = generate_image(prompt)
        logging.info(image_url)
        requests.post(webhook_url, json={'url': image_url, 'transaction': transactions})
        return image_url
    except Exception as e:
        logging.error(f"Failed during image generation process: {e}")
        raise


def save_image_from_url(image_url, file_path):
    """
    Download an image from a specified URL and save it to a local file.

    Parameters:
    - image_url (str): URL of the image to be downloaded.
    - file_path (str): Local path where the image should be saved.

    Returns:
    str: A message indicating the success or failure of the operation.
    """

    try:
        response = requests.get(image_url)
        response.raise_for_status()

        with open(file_path, 'wb') as f:
            f.write(response.content)

        logging.info(f"Image saved successfully at: {file_path}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to fetch image from URL: {image_url} - {e}")
        raise requests.exceptions.RequestException(f"Failed to fetch image from URL: {e}") from e
    except IOError as e:
        logging.error(f"Failed to save image to {file_path} - {e}")
        raise IOError(f"Failed to save image to {file_path}: {e}") from e


def load_config(config_path):
    """
    Load and validate the INI configuration file.

    Parameters:
    - config_path (str or Path): The path to the configuration file which needs to be loaded.

    Returns:
    configparser.ConfigParser: A ConfigParser object containing the loaded configuration data.
    """

    config_path = Path(config_path)

    if not config_path.exists() or not config_path.is_file():
        logging.error(f"Configuration file not found at: {config_path}")
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")

    config = configparser.ConfigParser()
    try:
        config.read(config_path)
    except configparser.Error as e:
        logging.error(f"Failed to parse configuration file: {e}")
        raise configparser.Error(f"Failed to parse configuration file: {e}")

    return config


def logging_config(config):
    """
    Configure the application's logging settings based on the provided configuration.

    Parameters:
    - config (configparser.ConfigParser): Configuration loaded from an INI file which contains logging settings.
    """

    try:
        log_level = getattr(logging, config['LOGGING']['LogLevel'].upper(), logging.INFO)
        log_file = Path(config['LOGGING']['LogFile'])
        log_file.parent.mkdir(parents=True, exist_ok=True)

        logging.basicConfig(level=log_level,
                            format='%(asctime)s - %(levelname)s - %(message)s',
                            handlers=[logging.FileHandler(log_file, encoding='utf-8'), logging.StreamHandler()])
    except Exception as e:
        logging.error(f"Failed to configure logging: {e}")
        raise


def initialize_openai_config(config):
    """
    Initialize and set global variables for the OpenAI configuration based on settings in the provided config object.

    Parameters:
    - config (configparser.ConfigParser): Loaded configuration data from an INI file.
    """

    global openai_api_key, openai_organization_id, openai_model_name_prompt_generation
    global openai_model_name_image_generation, openai_image_resolution, openai_image_quality, openai_number_of_images
    global openai_temperature, openai_max_tokens, openai_top_p
    global openai_frequency_penalty, openai_presence_penalty
    global webhook_url

    openai_api_key = config['OPENAI']['APIKey']
    openai_organization_id = config['OPENAI']['OrganizationID']

    openai_model_name_prompt_generation = config['OPENAI']['ModelNamePromptGeneration']
    openai_temperature = float(config['OPENAI']['Temperature'])
    openai_max_tokens = int(config['OPENAI']['MaxTokens'])
    openai_top_p = float(config['OPENAI']['TopP'])
    openai_frequency_penalty = float(config['OPENAI']['FrequencyPenalty'])
    openai_presence_penalty = float(config['OPENAI']['PresencePenalty'])

    openai_model_name_image_generation = config['OPENAI']['ModelNameImageGeneration']
    openai_image_resolution = config['OPENAI']['ImageResolution']
    openai_image_quality = config['OPENAI']['ImageQuality']
    openai_number_of_images = int(config['OPENAI']['NumberOfImages'])

    webhook_url = config['BASE']['WebhookURL']


def main(config_path, json_input):
    """
    Main execution function.

    Parameters:
    - config_path (str): Path to the configuration file (.ini format).
    """

    config = load_config(config_path)
    logging_config(config)
    initialize_openai_config(config)

    logging.error(json_input)

    example_image_URL = parse_JSON_and_generate_image(json_input)

    example_image_save_path = 'scripts/image.png'
    save_image_from_url(example_image_URL, example_image_save_path)


if __name__ == "__main__":
    json_input = sys.argv[1]
    main('scripts/config.ini', json_input)
