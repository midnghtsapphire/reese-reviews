from sequential_fill import DEFAULT_DELAY, FillConfig, parse_delay_arg, run_fill, STEPS


class FakeForm:
    def __init__(self):
        self.rating = None
        self.title = None
        self.photos = None
        self.body = None
        self.submitted = False
        self.order: list[str] = []

    def set_rating(self, stars: int) -> None:
        self.rating = stars
        self.order.append("rating")

    def set_title(self, title: str) -> None:
        self.title = title
        self.order.append("title")

    def attach_photos(self, paths: list[str]) -> None:
        self.photos = list(paths)
        self.order.append("photos")

    def set_body(self, body: str) -> None:
        self.body = body
        self.order.append("body")

    def click_submit(self) -> None:
        self.submitted = True
        self.order.append("submit")


def test_fills_title_then_images_then_review_and_never_submits():
    form = FakeForm()
    slept: list[float] = []
    result = run_fill(
        form,
        title="A solid title",
        body="The written review.",
        photo_paths=["final-review.jpg"],
        rating=4,
        config=FillConfig(delay_min=3, delay_max=6, sleep=slept.append, random=lambda: 0.5),
    )
    assert STEPS == ("headline", "photos", "body")
    assert form.order == ["rating", "title", "photos", "body"]
    assert form.title == "A solid title"
    assert form.photos == ["final-review.jpg"]
    assert form.body == "The written review."
    assert form.rating == 4
    assert form.submitted is False
    assert "submit" not in form.order
    assert result.awaiting_human_submit is True
    assert len(slept) == 2
    assert all(3 <= pause <= 6 for pause in slept)


def test_parse_delay_arg():
    assert parse_delay_arg("4") == (4.0, 4.0)
    assert parse_delay_arg("3-6") == (3.0, 6.0)
    assert DEFAULT_DELAY == (3.0, 6.0)
