import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";

type TodoItem = {
  id: number;
  title: string;
};

function TodoList() {
  const { data, isPending } = useQuery({
    queryKey: ["todos"],
    queryFn: async () =>
      (await fetch("https://jsonplaceholder.typicode.com/todos")).json(),
  });
  return (
    <>
      <div className="flex flex-col items-center">
        <Button className="m-4">Hello!!!</Button>
        <div className="flex flex-col justify-center gap-2">
          {isPending && <Loader />}
          {data?.map((item: TodoItem) => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      </div>
    </>
  );
}

export default TodoList;
