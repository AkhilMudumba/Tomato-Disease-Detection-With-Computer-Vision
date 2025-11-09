TOMATO_DISEASE_DATABASE= {
            'Tomato_Bacterial_spot': {
                'optimal_temp': (20, 35),
                'optimal_humidity': (80, 95),
                'severity_levels': {
                    'low': 'Small, dark spots on leaves',
                    'medium': 'Enlarged spots with yellow halos',
                    'high': 'Defoliation and fruit spots'
                },
                'treatments': [
                    "Apply copper-based bactericides every 7-10 days",
                    "Remove and destroy infected plant debris",
                    "Rotate crops for 2-3 years",
                    "Use disease-free seeds and transplants",
                    "Avoid overhead irrigation"
                ],
                'preventive_measures': [
                    "Use resistant varieties",
                    "Maintain proper plant spacing",
                    "Sanitize tools and equipment",
                    "Avoid working with wet plants"
                ],
                'organic_treatments': [
                    "Apply copper sulfate or Bordeaux mixture",
                    "Use compost tea sprays",
                    "Apply neem oil solutions",
                    "Implement biological control agents"
                ]
            },
            'Tomato_Early_blight': {
                'optimal_temp': (20, 25),
                'optimal_humidity': (60, 80),
                'severity_levels': {
                    'low': 'Small brown spots on lower leaves',
                    'medium': 'Concentric rings in spots, leaf yellowing',
                    'high': 'Significant defoliation and fruit infection'
                },
                'treatments': [
                    "Apply fungicides containing chlorothalonil",
                    "Remove infected leaves immediately",
                    "Improve air circulation",
                    "Apply proper nitrogen fertilization",
                    "Use protective fungicides"
                ],
                'preventive_measures': [
                    "Use disease-resistant varieties",
                    "Practice crop rotation",
                    "Maintain proper plant spacing",
                    "Mulch around plants"
                ],
                'organic_treatments': [
                    "Apply copper-based organic fungicides",
                    "Use neem oil solutions",
                    "Implement sulfur-based sprays",
                    "Apply compost tea"
                ]
            },
            'Tomato_Late_blight': {
                'optimal_temp': (10, 20),
                'optimal_humidity': (90, 100),
                'severity_levels': {
                    'low': 'Water-soaked spots on leaves',
                    'medium': 'Brown lesions with white growth',
                    'high': 'Rapid plant collapse and fruit rot'
                },
                'treatments': [
                    "Apply systemic fungicides immediately",
                    "Remove and destroy infected plants",
                    "Increase plant spacing",
                    "Apply copper-based fungicides",
                    "Harvest remaining healthy fruit"
                ],
                'preventive_measures': [
                    "Use resistant varieties",
                    "Monitor weather conditions",
                    "Improve drainage",
                    "Avoid overhead irrigation"
                ],
                'organic_treatments': [
                    "Apply copper hydroxide",
                    "Use biological fungicides",
                    "Implement copper sulfate sprays",
                    "Apply organic copper formulations"
                ]
            },
            'Tomato_Leaf_Mold': {
                'optimal_temp': (21, 24),
                'optimal_humidity': (85, 100),
                'severity_levels': {
                    'low': 'Yellow spots on upper leaf surface',
                    'medium': 'Olive green mold on leaf undersides',
                    'high': 'Severe defoliation'
                },
                'treatments': [
                    "Apply fungicides with chlorothalonil",
                    "Remove infected leaves",
                    "Improve greenhouse ventilation",
                    "Reduce humidity levels",
                    "Space plants properly"
                ],
                'preventive_measures': [
                    "Use resistant varieties",
                    "Improve air circulation",
                    "Avoid leaf wetness",
                    "Monitor humidity levels"
                ],
                'organic_treatments': [
                    "Apply potassium bicarbonate",
                    "Use copper-based organic fungicides",
                    "Implement natural ventilation",
                    "Apply compost tea sprays"
                ]
            },
            'Tomato_Septoria_leaf_spot': {
                'optimal_temp': (20, 25),
                'optimal_humidity': (75, 85),
                'severity_levels': {
                    'low': 'Small circular spots with dark borders',
                    'medium': 'Numerous spots causing leaf yellowing',
                    'high': 'Severe defoliation'
                },
                'treatments': [
                    "Apply chlorothalonil-based fungicides",
                    "Remove infected leaves",
                    "Improve air circulation",
                    "Maintain proper fertility",
                    "Apply copper-based products"
                ],
                'preventive_measures': [
                    "Practice crop rotation",
                    "Use mulch",
                    "Avoid overhead watering",
                    "Space plants properly"
                ],
                'organic_treatments': [
                    "Apply organic copper fungicides",
                    "Use sulfur-based sprays",
                    "Implement botanical fungicides",
                    "Apply neem oil solutions"
                ]
            },
            'Tomato_Spider_mites_Two_spotted_spider_mite': {
                'optimal_temp': (27, 35),
                'optimal_humidity': (20, 40),
                'severity_levels': {
                    'low': 'Light stippling on leaves',
                    'medium': 'Visible webbing and leaf yellowing',
                    'high': 'Severe leaf damage and plant decline'
                },
                'treatments': [
                    "Apply specific miticides",
                    "Use insecticidal soaps",
                    "Release predatory mites",
                    "Increase humidity",
                    "Apply horticultural oils"
                ],
                'preventive_measures': [
                    "Monitor regularly",
                    "Maintain proper irrigation",
                    "Control dust",
                    "Preserve natural enemies"
                ],
                'organic_treatments': [
                    "Apply neem oil",
                    "Use rosemary oil",
                    "Implement insecticidal soaps",
                    "Release beneficial insects"
                ]
            },
            'Tomato__Target_Spot': {
                'optimal_temp': (20, 25),
                'optimal_humidity': (70, 90),
                'severity_levels': {
                    'low': 'Small brown spots on leaves',
                    'medium': 'Circular lesions with concentric rings',
                    'high': 'Severe defoliation and fruit spots'
                },
                'treatments': [
                    "Apply fungicides preventively",
                    "Remove infected tissue",
                    "Improve air circulation",
                    "Reduce leaf wetness",
                    "Apply copper-based products"
                ],
                'preventive_measures': [
                    "Use resistant varieties",
                    "Proper spacing",
                    "Avoid overhead irrigation",
                    "Regular monitoring"
                ],
                'organic_treatments': [
                    "Apply organic copper fungicides",
                    "Use botanical fungicides",
                    "Implement sulfur sprays",
                    "Apply biological controls"
                ]
            },
            'Tomato__Tomato_YellowLeaf__Curl_Virus': {
                'optimal_temp': (20, 30),
                'optimal_humidity': (60, 80),
                'severity_levels': {
                    'low': 'Slight leaf curling and yellowing',
                    'medium': 'Significant leaf curling and plant stunting',
                    'high': 'Severe stunting and no fruit production'
                },
                'treatments': [
                    "Remove and destroy infected plants",
                    "Control whitefly populations",
                    "Use reflective mulches",
                    "Apply appropriate insecticides",
                    "Install physical barriers"
                ],
                'preventive_measures': [
                    "Use resistant varieties",
                    "Control weeds",
                    "Monitor for whiteflies",
                    "Use insect screens"
                ],
                'organic_treatments': [
                    "Apply insecticidal soaps",
                    "Use neem oil",
                    "Implement yellow sticky traps",
                    "Release natural predators"
                ]
            },
            'Tomato__Tomato_mosaic_virus': {
                'optimal_temp': (20, 30),
                'optimal_humidity': (60, 80),
                'severity_levels': {
                    'low': 'Mild mottling of leaves',
                    'medium': 'Significant mottling and leaf distortion',
                    'high': 'Severe stunting and fruit symptoms'
                },
                'treatments': [
                    "Remove and destroy infected plants",
                    "Control insect vectors",
                    "Sanitize tools and equipment",
                    "Maintain proper nutrition",
                    "Monitor for symptoms"
                ],
                'preventive_measures': [
                    "Use virus-free seeds",
                    "Practice crop rotation",
                    "Control weeds",
                    "Wash hands frequently"
                ],
                'organic_treatments': [
                    "Apply milk spray solution",
                    "Use neem oil",
                    "Implement biological controls",
                    "Apply plant extracts"
                ]
            }
        }