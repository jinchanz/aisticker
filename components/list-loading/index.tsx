export default function () {
  return <div className="flex flex-row gap-2 justify-center">
  <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce"></div>
  <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.3s]"></div>
  <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.5s]"></div>
</div>;
}