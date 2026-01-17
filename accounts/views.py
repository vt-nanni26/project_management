import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@csrf_exempt
def register_user(request):
    if request.method == 'GET':
        return JsonResponse({
            "message": "Register API working. Use POST with username & password."
        })

    if request.method == 'POST':
        import json
        try:
            data = json.loads(request.body)
        except:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse({"error": "Username and password required"}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "User already exists"}, status=400)

        User.objects.create_user(username=username, password=password)
        return JsonResponse({"message": "User registered successfully"})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def login_user(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    username = data.get('username')
    password = data.get('password')

    user = authenticate(username=username, password=password)

    if user is None:
        return JsonResponse({'error': 'Invalid credentials'}, status=401)

    login(request, user)
    return JsonResponse({'message': 'Login successful'})


def logout_user(request):
    logout(request)
    return JsonResponse({'message': 'Logged out'})


def current_user(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'username': request.user.username,
            'id': request.user.id
        })
    return JsonResponse({'user': None})
