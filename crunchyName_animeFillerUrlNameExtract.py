import requests, re, json
from bs4 import BeautifulSoup

# Define the URL of the page to scrape
url = 'https://www.animefillerlist.com/shows'

# Send a GET request to fetch the raw HTML content
response = requests.get(url)
html_content = response.text

# Parse the HTML content using BeautifulSoup
soup = BeautifulSoup(html_content, 'html.parser')

# Create a dictionary to hold anime names and URLs
anime_list = []

# Find all list items or anchor tags with anime names and URLs
# Adjust the selector as needed based on HTML structure
for item in soup.find('div', {"id": "ShowList"}).find_all('a', href=True):
    name = item.get_text(strip=True)
    url = item['href']
    # Remove any text in brackets
    name = re.sub(r'\[.*?\]', '', name).split('(')[0].strip()
    anime_list.append({'title': name.lower(), 'url': url.split('/')[-1].strip().lower()})

with open('crunchyName_animeFillerUrlName.json', 'w', encoding='utf8') as f:
    json.dump(anime_list, f, indent=4)
