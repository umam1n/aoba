import os
import requests
import zipfile

def download_data():
    url = "https://raw.githubusercontent.com/IBM/employee-attrition-aif360/master/data/emp_attrition.csv"
    os.makedirs('scripts/data', exist_ok=True)
    
    print("Downloading IBM HR Analytics dataset...")
    response = requests.get(url)
    if response.status_code == 200:
        with open('scripts/data/ibm_hr_attrition.csv', 'wb') as f:
            f.write(response.content)
        print("Download complete: scripts/data/ibm_hr_attrition.csv")
    else:
        print(f"Failed to download data: {response.status_code}")
        
    print("\n---")
    print("To generate a FIELD_ENCRYPTION_KEY for .env, run:")
    print("python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"")

if __name__ == "__main__":
    download_data()
